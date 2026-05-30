// Import
import * as React from 'react';
import {
  NavigationContainer,
  Theme,
  DrawerActions,
  useNavigation,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import NavigationService, { navigationRef } from './NavigationService';
import { StyleSheet, Text, StatusBar, View, Platform } from 'react-native';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ant-design';
import AppStyle, { useThemeColors } from '../config/styles';

//Screen Import
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import Splash from '../screens/Splash';
import Home from '../screens/Home';
import About from '../screens/About';
import ScanQR from '../screens/Home/ScanQR';
import PersonDetails from '../screens/Home/PersonDetails';
import MenteesList from '../screens/Home/MenteesList';
import TaskDetail from '../screens/Home/TaskDetail';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import MasterTaskManager from '../screens/Admin/MasterTaskManager';
import UserRoleManager from '../screens/Admin/UserRoleManager';
import { useUserStore } from '../store';
import Coming_soon from '../screens/Default/Coming_soon';

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const UserAppStack = createStackNavigator();
const ios = Platform.OS === 'ios';

interface IProps {
  theme: Theme;
}

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="Splash"
        component={Splash}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen
        name="Register"
        component={Register}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </AuthStack.Navigator>
  );
};

const MainApp = () => {
  useThemeColors();

  const userAppMenu = [
    {
      screen_name: 'Home',
      component: Home,
      options: {
        title: 'Home',
        headerStyle: {
          backgroundColor: AppStyle.light.secondaryLight,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: AppStyle.color.white,
      },
    },
    {
      screen_name: 'About',
      component: About,
      options: {
        title: 'Profile Details',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: AppStyle.color.white,
      },
    },
    {
      screen_name: 'ScanQR',
      component: ScanQR,
      options: {
        headerShown: false,
      },
    },
    {
      screen_name: 'PersonDetails',
      component: PersonDetails,
      options: {
        title: 'Mentor Details',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    },
    {
      screen_name: 'MenteesList',
      component: MenteesList,
      options: {
        title: 'My Mentees',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    },
    {
      screen_name: 'TaskDetail',
      component: TaskDetail,
      options: {
        title: 'Task Details',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    },
    {
      screen_name: 'Coming_soon',
      component: Coming_soon,
      options: {
        title: 'Coming Soon',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    },
  ];

  const user = useUserStore(state => state.user);
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    userAppMenu.push({
      screen_name: 'AdminDashboard',
      component: AdminDashboard,
      options: {
        title: 'Admin Dashboard',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    });

    userAppMenu.push({
      screen_name: 'MasterTaskManager',
      component: MasterTaskManager,
      options: {
        title: 'Manage Tasks',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    });

    userAppMenu.push({
      screen_name: 'UserRoleManager',
      component: UserRoleManager,
      options: {
        title: 'Manage Admins',
        headerStyle: {
          backgroundColor: AppStyle.light.primary,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTitleAllowFontScaling: false,
        headerTintColor: '#fff',
      },
    });
  }

  return (
    <UserAppStack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'left',
        headerLeft: () =>
          navigation.canGoBack() ? (
            <Icon
              name="left"
              size={24}
              color="#fff"
              style={{ marginHorizontal: 5 }}
              onPress={() => NavigationService.goBack()}
            />
          ) : null,
      })}
    >
      {userAppMenu.map((item, index) => (
        <UserAppStack.Screen
          key={index}
          name={item.screen_name}
          component={item.component}
          options={item.options}
        />
      ))}
    </UserAppStack.Navigator>
  );
};

const App: React.FC<IProps> = (props: IProps) => {
  const { theme } = props;

  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      <StatusBar translucent={true} backgroundColor={AppStyle.light.primary} />

      <Stack.Navigator>
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="MainApp"
          component={MainApp}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabbarStyle: {
    color: '#07245B',
    fontSize: 11,
  },
  unselecttabbarStyle: {
    color: 'gray',
    fontSize: 11,
  },
});

export default App;
