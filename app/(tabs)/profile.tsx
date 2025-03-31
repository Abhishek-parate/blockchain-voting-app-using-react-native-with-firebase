// app/(tabs)/profile.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Avatar, ListItem, Switch, Divider, useTheme } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getElections } from '../../utils/firebase';

interface Election {
  id: string;
  title: string;
  voters: string[];
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [votedElections, setVotedElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's voting history
  useEffect(() => {
    const fetchVotingHistory = async () => {
      if (user) {
        try {
          const { elections, error } = await getElections(false);
          if (elections && !error) {
            const voted = elections.filter(election => 
              election.voters.includes(user.uid)
            );
            setVotedElections(voted);
          }
        } catch (error) {
          console.error('Error fetching voting history:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVotingHistory();
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            const result = await signOut();
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, this would update the theme context
    Alert.alert('Theme', 'Dark mode toggled. This feature is not fully implemented in this demo.');
  };

  // Generate initials for avatar
  const getInitials = () => {
    if (userProfile?.name) {
      const nameParts = userProfile.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return 'U';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.profileHeader}>
        <Avatar
          size={80}
          rounded
          title={getInitials()}
          containerStyle={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.profileInfo}>
          <Text h4 style={{ color: theme.colors.black }}>
            {userProfile?.name || 'User'}
          </Text>
          <Text style={{ color: theme.colors.grey4 }}>
            {user?.email}
          </Text>
          <View style={styles.badgeContainer}>
            {userProfile?.isAdmin ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.badgeText}>Voter</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Card containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
        <Card.Title>Account Settings</Card.Title>
        <Card.Divider />
        
        <ListItem bottomDivider>
          <Ionicons name="moon-outline" size={24} color={theme.colors.grey4} />
          <ListItem.Content>
            <ListItem.Title>Dark Mode</ListItem.Title>
          </ListItem.Content>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            color={theme.colors.primary}
          />
        </ListItem>
        
        <ListItem bottomDivider onPress={() => Alert.alert('Notifications', 'This feature is not implemented in the demo.')}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.grey4} />
          <ListItem.Content>
            <ListItem.Title>Notifications</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        
        <ListItem onPress={() => Alert.alert('Security', 'This feature is not implemented in the demo.')}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.grey4} />
          <ListItem.Content>
            <ListItem.Title>Security</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
        <Card.Title>Voting History</Card.Title>
        <Card.Divider />
        
        {loading ? (
          <Text style={{ textAlign: 'center', padding: 20, color: theme.colors.grey3 }}>
            Loading voting history...
          </Text>
        ) : votedElections.length > 0 ? (
          votedElections.map((election, index) => (
            <React.Fragment key={election.id}>
              <ListItem
                onPress={() => router.push(`/election/${election.id}/results`)}
                bottomDivider={index < votedElections.length - 1}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
                <ListItem.Content>
                  <ListItem.Title>{election.title}</ListItem.Title>
                  <ListItem.Subtitle>You've voted in this election</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
              </ListItem>
            </React.Fragment>
          ))
        ) : (
          <Text style={{ textAlign: 'center', padding: 20, color: theme.colors.grey3 }}>
            You haven't voted in any elections yet
          </Text>
        )}
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
        <Card.Title>About</Card.Title>
        <Card.Divider />
        
        <ListItem bottomDivider onPress={() => Alert.alert('About', 'Blockchain Voting System v1.0.0')}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.grey4} />
          <ListItem.Content>
            <ListItem.Title>App Version</ListItem.Title>
          </ListItem.Content>
          <Text style={{ color: theme.colors.grey3 }}>1.0.0</Text>
        </ListItem>
        
        <ListItem onPress={() => Alert.alert('Privacy Policy', 'This is a demo app for educational purposes only.')}>
          <Ionicons name="shield-outline" size={24} color={theme.colors.grey4} />
          <ListItem.Content>
            <ListItem.Title>Privacy Policy</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      </Card>

      <Button
        title="Sign Out"
        icon={
          <Ionicons
            name="log-out-outline"
            size={20}
            color="white"
            style={{ marginRight: 10 }}
          />
        }
        onPress={handleSignOut}
        buttonStyle={[styles.signOutButton, { backgroundColor: theme.colors.error }]}
        containerStyle={styles.signOutButtonContainer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
  },
  signOutButton: {
    height: 50,
    borderRadius: 10,
  },
  signOutButtonContainer: {
    marginHorizontal: 15,
    marginVertical: 25,
  },
});