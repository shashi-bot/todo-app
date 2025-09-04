import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Network Status Indicator Component
 * Shows online/offline status with animated toast at top of screen
 */

const { width } = Dimensions.get('window');

interface NetworkStatusIndicatorProps {
  children: React.ReactNode;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const currentlyOnline = state.isConnected ?? false;
      
      setIsOnline(currentlyOnline);
      
      // Show status change notification
      if (wasOnline !== currentlyOnline) {
        showStatusNotification();
      }
    });

    return unsubscribe;
  }, [isOnline]);

  const showStatusNotification = () => {
    setShowStatus(true);
    
    // Slide down
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Wait 3 seconds
      Animated.delay(3000),
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowStatus(false);
    });
  };

  return (
    <View style={styles.container}>
      {children}
      
      {showStatus && (
        <Animated.View
          style={[
            styles.statusBar,
            {
              backgroundColor: isOnline ? '#28a745' : '#dc3545',
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Icon
            name={isOnline ? 'wifi' : 'wifi-outline'}
            size={16}
            color="#fff"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Back online' : 'You\'re offline'}
          </Text>
          {isOnline && (
            <Text style={styles.statusSubtext}>
              Syncing your changes...
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  statusSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
});

export default NetworkStatusIndicator;
