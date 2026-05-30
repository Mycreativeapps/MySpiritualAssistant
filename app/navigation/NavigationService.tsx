import * as React from 'react';
import { CommonActions, NavigationContainerRef, StackActions } from '@react-navigation/native';

// NavigationContainer is referred here - Check NavigationStack
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

function navigate(name: string, params?: any) {
  navigationRef.current?.navigate(name, params);
}

function replace(name: string, params?: any) {
  navigationRef.current?.dispatch(StackActions.replace(name, params));
}

function goBack() {
  navigationRef.current?.goBack();
}

function logout(name:string, params?: any){
  navigationRef.current?.dispatch(CommonActions.reset({
    index: 0,
    routes: [{ name: name, params:params }], // Replace with your Auth screen name
   
  }));
};


export default {
  navigate,
  goBack,
  replace,
  logout
};