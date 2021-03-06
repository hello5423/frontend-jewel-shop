import axios from "axios";
import { createContext, useReducer, useLayoutEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { toast } from "react-toastify";

import { Firebase, Db } from "../../Firebase/firebase";
import { setAuthToken } from "../../utils/setAuthToken";
import authReducer from "../reducer/AuthReducer";
import {
  API_URL,
  LOAD_USER,
  UPDATE_USER,
  LOCAL_STORAGE_TOKEN_NAME,
} from "./constant";

export const AuthContext = createContext();

let displayNameStorage = localStorage.getItem("token_kithuat_auth");
if (displayNameStorage) {
  displayNameStorage = JSON.parse(displayNameStorage);
}
export const AuthContextProvider = ({ children }) => {
  let [authState, dispatch] = useReducer(authReducer, {
    userAuth: null,
    isLoginAuth: displayNameStorage ? true : false,
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const loadUser = async () => {
    if (localStorage[LOCAL_STORAGE_TOKEN_NAME]) {
      setAuthToken(localStorage[LOCAL_STORAGE_TOKEN_NAME]);
    } else {
      setAuthToken(null);
    }
    try {
      const response = await axios.get(`${API_URL}/users`);

      dispatch({
        type: LOAD_USER,
        payload: response.data.data,
      });
    } catch (error) {
      dispatch({
        type: LOAD_USER,
        payload: null,
      });
    }
  };

  const login = async (user) => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, user);
      if (response.data.success) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, response.data.token);
        toast.success("Đăng nhập thành công!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(`Đăng nhập thất bại: ${response.data.message}`);
      }
      await loadUser();
    } catch (error) {
      dispatch({
        type: LOAD_USER,
        payload: null,
      });
    }
  };

  // ===============Aoth2=============

  // async function addUserData(
  //   userId,
  //   name,
  //   username,
  //   email,
  //   telephone,
  //   address,
  //   role
  // ) {
  //   const docData = {
  //     userId: userId,
  //     username: username,
  //     name: name,
  //     telephone: telephone,
  //     address: address,
  //     role: role,
  //     email: email,
  //   };
  //   try {
  //     const docRef = await addDoc(collection(Db, "users"), docData);
  //     console.log("Document written with ID: ", docRef);
  //     console.log("Documen", docData);
  //   } catch (e) {
  //     console.error("Error adding document: ", e);
  //   }
  // }
  const LoginWithFirebase = async (type) => {
    const google_provider = new GoogleAuthProvider();
    const facebook_provider = new FacebookAuthProvider();
    const auth = getAuth(Firebase);
    switch (type) {
      case "GOOGLE_LOGIN":
        await signInWithPopup(auth, google_provider)
          .then((result) => {
            if (result.user) {
              localStorage.setItem(
                "token_kithuat_auth",
                JSON.stringify({
                  token: result.user.accessToken,
                  displayName: result.user.displayName,
                })
              );

              authState.userAuth = result.user;
              authState.isLoginAuth = true;

              toast.success("Đăng nhập thành công!");
            }
            loadUser();
          })
          .catch((error) => {
            dispatch({
              type: LOAD_USER,
              payload: null,
            });
          });
        break;
      case "FACEBOOK_LOGIN":
        await signInWithPopup(auth, facebook_provider)
          .then((result) => {
            if (result.user) {
              localStorage.setItem(
                "token_kithuat_auth",
                JSON.stringify({
                  token: result.user.accessToken,
                  displayName: result.user.displayName,
                })
              );
              authState.userAuth = result.user;
              authState.isLoginAuth = true;
              toast.success("Đăng nhập thành công!");
            }
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((error) => {
            console.log(error.message);
            dispatch({
              type: LOAD_USER,
              payload: null,
            });
          });
        break;

      default:
        break;
    }
  };
  const register = async (user) => {
    try {
      const response = await axios.post(`${API_URL}/users/register`, user);
      if (response.data.success) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, response.data.token);
        setAuthToken(response.data.token);
        await axios.post(`${API_URL}/favourite/user`);
        toast.success("Đăng ký thành công!");
      } else {
        toast.error(`Đăng ký thất bại: ${response.data.message}`);
      }
      await loadUser();
    } catch (error) {
      console.log(error.message);
      dispatch({
        type: LOAD_USER,
        payload: null,
      });
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      if (response.data.success) {
        dispatch({
          type: UPDATE_USER,
          payload: response.data.data,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
    localStorage.removeItem("token_kithuat_auth");
    authState.isLoginAuth = false;
    await loadUser();
  };

  useLayoutEffect(() => {
    loadUser();
  }, []);

  const authData = {
    authState,
    login,
    LoginWithFirebase,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>
  );
};
