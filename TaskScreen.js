import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Platform, ImageBackground
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { auth, db } from './firebase';
import {
  collection, addDoc, onSnapshot, query,
  where, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

export default function TaskScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('none');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = [];
      snapshot.forEach((doc) => {
        taskData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(taskData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddOrEditTask = async () => {
    if (!task.trim()) return;

    const trigger = repeat === 'none'
      ? dueDate
      : {
          hour: dueDate.getHours(),
          minute: dueDate.getMinutes(),
          repeats: true,
        };

    if (isEditing && editingTaskId) {
      const taskRef = doc(db, 'tasks', editingTaskId);
      await updateDoc(taskRef, {
        text: task,
        dueDate: dueDate.toISOString(),
        repeat,
      });
    } else {
      await addDoc(collection(db, 'tasks'), {
        text: task,
        uid: user.uid,
        dueDate: dueDate.toISOString(),
        repeat,
        completed: false,
        createdAt: Date.now()
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📒 Zilzzz Reminder",
          body: task,
          sound: true,
        },
        trigger,
      });
    }

    setTask('');
    setRepeat('none');
    setIsEditing(false);
    setEditingTaskId(null);
  };

  const startEditingTask = (taskItem) => {
    setTask(taskItem.text);
    setDueDate(new Date(taskItem.dueDate));
    setRepeat(taskItem.repeat || 'none');
    setIsEditing(true);
    setEditingTaskId(taskItem.id);
  };

  const cancelEdit = () => {
    setTask('');
    setIsEditing(false);
    setEditingTaskId(null);
    setRepeat('none');
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const toggleCompletion = async (taskItem) => {
    const taskRef = doc(db, 'tasks', taskItem.id);
    await updateDoc(taskRef, {
      completed: !taskItem.completed
    });
  };

  const formatDate = (date) => {
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ImageBackground
      source={require('./assets/bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => auth.signOut()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📒 Your Tasks</Text>

        <TextInput
          placeholder="Add or edit a task..."
          placeholderTextColor="#aaa"
          value={task}
          onChangeText={setTask}
          style={styles.input}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateText}>📅 {formatDate(dueDate)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={(e, selectedDate) => {
              const currentDate = selectedDate || dueDate;
              setShowDatePicker(Platform.OS === 'ios');
              setDueDate(currentDate);
              setShowTimePicker(true);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            display="default"
            onChange={(e, selectedTime) => {
              const time = selectedTime || dueDate;
              const updated = new Date(dueDate);
              updated.setHours(time.getHours());
              updated.setMinutes(time.getMinutes());
              setDueDate(updated);
              setShowTimePicker(false);
            }}
          />
        )}

        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>🔁 Repeat:</Text>
          <Picker
            selectedValue={repeat}
            style={styles.picker}
            dropdownIconColor="#fff"
            onValueChange={(value) => setRepeat(value)}
          >
            <Picker.Item label="None" value="none" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
          </Picker>
        </View>

        <TouchableOpacity onPress={handleAddOrEditTask} style={styles.addButton}>
          <Text style={styles.addText}>{isEditing ? '💾 Save Changes' : '➕ Add Task'}</Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel Editing ❌</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <TouchableOpacity onPress={() => toggleCompletion(item)} style={styles.checkWrapper}>
                <Text style={styles.checkIcon}>{item.completed ? '✅' : '☐'}</Text>
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskText, item.completed && { textDecorationLine: 'line-through', color: '#aaa' }]}> {item.text}</Text>
                <Text style={styles.dueText}>
                  ⏰ {formatDate(new Date(item.dueDate))} {item.repeat !== 'none' && `(🔁 ${item.repeat})`}
                </Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => startEditingTask(item)} style={{ marginRight: 10 }}>
                  <Text style={styles.editText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)}>
                  <Text style={styles.deleteText}>❌</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.85)',
    padding: 20,
    paddingTop: 60
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 10
  },
  logoutText: {
    color: '#ff6961',
    fontWeight: 'bold'
  },
  title: {
    color: '#fff8f0',
    fontSize: 26,
    marginBottom: 16,
    fontFamily: 'serif',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ffb6c1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    fontFamily: 'serif'
  },
  dateButton: { marginBottom: 10 },
  dateText: { color: '#ccc' },
  pickerWrapper: { marginBottom: 10 },
  label: { color: '#ccc', marginBottom: 4 },
  picker: {
    color: '#fff',
    backgroundColor: '#333',
    borderRadius: 6
  },
  addButton: {
    backgroundColor: '#ffb6c1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  addText: { fontWeight: 'bold' },
  cancelButton: { marginTop: 10, alignItems: 'center' },
  cancelText: { color: '#ff6961' },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2f2f2f',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffb6c1'
  },
  checkWrapper: {
    marginRight: 12
  },
  checkIcon: {
    fontSize: 20,
    color: '#fff'
  },
  taskInfo: {
    flex: 1
  },
  actionIcons: {
    flexDirection: 'row'
  },
  taskText: { color: '#fff', fontSize: 16 },
  dueText: { color: '#ccc', fontSize: 12 },
  deleteText: { fontSize: 16, color: '#ff6961' },
  editText: { fontSize: 16, color: '#add8e6' }
});
