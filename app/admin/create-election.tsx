// app/admin/create-election.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { 
  Text, 
  Input, 
  Button, 
  Card, 
  useTheme, 
  Divider, 
  ListItem 
} from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { createElection } from '../../utils/firebase';

interface Candidate {
  name: string;
  info: string;
}

export default function CreateElectionScreen() {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 1 week from now
  const [candidates, setCandidates] = useState<Candidate[]>([{ name: '', info: '' }]);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect non-admin users
  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to create elections.');
      router.replace('/(tabs)/home');
    }
  }, [userProfile]);

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', info: '' }]);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 1) {
      const updatedCandidates = [...candidates];
      updatedCandidates.splice(index, 1);
      setCandidates(updatedCandidates);
    }
  };

  const updateCandidate = (index: number, field: 'name' | 'info', value: string) => {
    const updatedCandidates = [...candidates];
    updatedCandidates[index][field] = value;
    setCandidates(updatedCandidates);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // Ensure end date is after start date
      if (selectedDate > endDate) {
        // Set end date to 1 day after new start date
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    // Check title
    if (!title.trim()) {
      setError('Please enter an election title');
      return false;
    }
    
    // Check description
    if (!description.trim()) {
      setError('Please enter an election description');
      return false;
    }
    
    // Check dates
    if (startDate >= endDate) {
      setError('End date must be after start date');
      return false;
    }
    
    // Check candidates
    if (candidates.length < 2) {
      setError('At least two candidates are required');
      return false;
    }
    
    // Check if all candidates have names
    for (let i = 0; i < candidates.length; i++) {
      if (!candidates[i].name.trim()) {
        setError(`Candidate #${i + 1} needs a name`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create an election');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await createElection({
        title,
        description,
        startDate,
        endDate,
        candidates,
        createdBy: user.uid
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        Alert.alert(
          'Success',
          'Election created successfully!',
          [
            {
              text: 'View Elections',
              onPress: () => router.replace('/(tabs)/elections'),
            },
          ]
        );
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text h4 style={styles.headerTitle}>Create New Election</Text>
          <View style={{ width: 40 }} />
        </View>

        <Card containerStyle={[styles.formCard, { backgroundColor: theme.colors.white }]}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            placeholder="Election Title"
            value={title}
            onChangeText={setTitle}
            leftIcon={<Ionicons name="create-outline" size={22} color={theme.colors.grey3} />}
            containerStyle={styles.inputContainer}
          />
          
          <Input
            placeholder="Election Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="document-text-outline" size={22} color={theme.colors.grey3} />}
            containerStyle={styles.inputContainer}
          />
          
          <Text style={styles.sectionTitle}>Election Timeline</Text>
          
          <TouchableOpacity
            style={[styles.datePickerButton, { borderColor: theme.colors.grey2 }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={22} color={theme.colors.grey3} />
            <Text style={styles.datePickerText}>
              Start Date: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}
          
          <TouchableOpacity
            style={[styles.datePickerButton, { borderColor: theme.colors.grey2 }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="time-outline" size={22} color={theme.colors.grey3} />
            <Text style={styles.datePickerText}>
              End Date: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
        </Card>

        <Card containerStyle={[styles.formCard, { backgroundColor: theme.colors.white }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Candidates</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={addCandidate}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {candidates.map((candidate, index) => (
            <View key={index} style={styles.candidateCard}>
              <View style={styles.candidateHeader}>
                <Text style={styles.candidateNumber}>Candidate #{index + 1}</Text>
                {candidates.length > 1 && (
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => removeCandidate(index)}
                  >
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Input
                placeholder="Candidate Name"
                value={candidate.name}
                onChangeText={(value) => updateCandidate(index, 'name', value)}
                containerStyle={styles.inputContainer}
              />
              
              <Input
                placeholder="Additional Information (optional)"
                value={candidate.info}
                onChangeText={(value) => updateCandidate(index, 'info', value)}
                multiline
                numberOfLines={2}
                containerStyle={styles.inputContainer}
              />
              
              {index < candidates.length - 1 && <Divider style={{ marginVertical: 15 }} />}
            </View>
          ))}
        </Card>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error }]}>
            <Ionicons name="alert-circle" size={22} color="white" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title="Create Election"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          icon={
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="white"
              style={{ marginRight: 10 }}
            />
          }
          buttonStyle={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          containerStyle={styles.submitButtonContainer}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  formCard: {
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    borderRadius: 20,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  datePickerText: {
    marginLeft: 10,
  },
  candidateCard: {
    marginBottom: 5,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  candidateNumber: {
    fontWeight: 'bold',
  },
  removeButton: {
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
  },
  errorText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  submitButton: {
    height: 50,
    borderRadius: 10,
  },
  submitButtonContainer: {
    marginVertical: 20,
  },
});
