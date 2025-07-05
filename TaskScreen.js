import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { auth, db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';

export default function TaskScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const handleAddTask = async () => {
    if (!task.trim()) return;

    // Add task to Firestore
    await addDoc(collection(db, 'tasks'), {
      text: task,
      uid: user.uid,
      dueDate: dueDate.toISOString(),
      createdAt: Date.now()
    });

    // Schedule local push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📒 Zilzzz Reminder",
        body: task,
        sound: true,
      },
      trigger: dueDate,
    });

    setTask('');
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
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
    <View style={styles.container}>
      <Text style={styles.title}>📒 Your Tasks</Text>

      <TextInput
        placeholder="Add a new task..."
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

      <TouchableOpacity onPress={handleAddTask} style={styles.addButton}>
        <Text style={styles.addText}>➕ Add Task</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <View>
              <Text style={styles.taskText}>🌙 {item.text}</Text>
              <Text style={styles.dueText}>⏰ {formatDate(new Date(item.dueDate))}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 24, marginBottom: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 8, marginBottom: 10, color: '#fff' },
  dateButton: { marginBottom: 10 },
  dateText: { color: '#ccc' },
  addButton: { backgroundColor: '#ffb6c1', padding: 12, borderRadius: 8, alignItems: 'center' },
  addText: { fontWeight: 'bold' },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  taskText: { color: '#fff', fontSize: 16 },
  dueText: { color: '#ccc', fontSize: 12 },
  deleteText: { fontSize: 16, color: '#ff6961' },
});
