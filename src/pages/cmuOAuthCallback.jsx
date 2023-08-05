import axios, { AxiosError } from "axios";
import { async } from "q";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCookie } from "cookies-next";

export default function CMUOAuthCallback() {

  const queryParameters = new URLSearchParams(window.location.search);
  const code = queryParameters.get("code");
  const navigate = useNavigate();

  async function signIn(authorizationCode) {
    try {
      const resp = await 
      axios
        .post(
          `${process.env.REACT_APP_BASE_URL}/api/v1/cmuOAuth/`,
          {},
          {
            params: {
              code: authorizationCode,
              redirect_uri: process.env.REACT_APP_CMU_OAUTH_REDIRECT_URL,
              client_id: process.env.REACT_APP_CMU_OAUTH_CLIENT_ID,
              client_secret: process.env.REACT_APP_CMU_OAUTH_CLIENT_SECRET,
              grant_type: "authorization_code",
            },
          }
        )
      return resp.data;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {

    if (!code) return navigate('/sign-in');

    const fetchData = async () => {
      const resp = await signIn(code);
      if(resp.token) {
        navigate('/student-dashboard', {state: {userInfo: resp.userInfo, token: resp.token, jwt: resp.jwt}})
      }
    }

    fetchData();
    
  }, [code]);

}
