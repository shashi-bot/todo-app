import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
