import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import InputBox from "../components/InputBox";
import { FacebookLoginButton } from "react-social-login-buttons";
import { LoginSocialFacebook } from "reactjs-social-login";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-hot-toast";
import BarGraph from "../components/BarGraph";

export default function Home() {
  const [name, setName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [nameState, setNameState] = useState([]);
  const [sentiments, setSentiments] = useState([]);
  const [probabilities, setProbabilities] = useState([]);
  const [urlState, setUrlState] = useState([]);
  const [sentimentsImg, setSentimetnsImg] = useState([]);
  const [probabilitiesImg, setProbabilitiesImg] = useState([]);
  const [isAnalyze, setIsAnalyze] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isLogIn, setIsLogIn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const labels = [
    "Anxiety",
    "Bipolar",
    "Depression",
    "Normal",
    "Personality disorder",
    "Stress",
    "Suicidal",
  ];
  const imgLabels = [
    "Anger",
    "Disgust",
    "Fear",
    "Happiness",
    "Sadness",
    "Surprise",
  ];
  const handleSocialLoginSuccess = (res) => {
    const token = res.data.accessToken;
    getName(token);
    getPost(token);
    setAccessToken(token);
    setIsLogIn(true);
    Cookies.set("accessToken", token, { expires: 3 });
    toast.success("Log In Successful");
  };
  const handleSocialLoginError = (err) => {
    console.log(err);
  };
  const getName = (token) => {
    axios
      .get(
        `https://graph.facebook.com/v21.0/me?fields=name&access_token=${token}`
      )
      .then((res) => {
        setName(res.data.name);
      })
      .catch((err) => {
        console.error("Error fetching user name:", err);
      });
  };
  const getPost = (token) => {
    axios
      .get(
        `https://graph.facebook.com/v21.0/me/posts?fields=message,full_picture&access_token=${token}`
      )
      .then((res) => {
        setPosts(res.data.data);
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
      });
  };
  const handlePost = async () => {
    let name = [];
    let urls = [];
    posts.map((a) => {
      if (a.message && a.message != "") {
        name.push(a.message);
      }
    });
    posts.map((a) => {
      if (a.full_picture && a.full_picture != "") {
        urls.push(a.full_picture);
      }
    });
    setNameState(name);
    setUrlState(urls);
    try {
      setIsTyping(true);
      const res = await axios.post("http://127.0.0.1:5000/data", { name });
      const resImg = await axios.post("http://127.0.0.1:5000/image", {
        name: urls,
      });
      const senti = res.data[0];
      const probF = res.data[1];
      const sentiImg = resImg.data[0];
      const probFImg = resImg.data[1];
      const sum = probF.reduce((acc, current) => {
        return acc.map((val, idx) => val + current[idx]);
      });
      const sumImg = probFImg.reduce((acc, current) => {
        return acc.map((val, idx) => val + current[idx]);
      });
      const probs = sum.map(
        (val) => parseFloat((val / res.data[1].length).toFixed(2)) * 100
      );
      const probsImg = sumImg.map((val) =>
        parseFloat((val / resImg.data[1].length).toFixed(2))
      );
      setSentiments(senti);
      setProbabilities(probs);
      setSentimetnsImg(sentiImg);
      setProbabilitiesImg(probsImg);
      setIsAnalyze(true);
    } catch (err) {
      console.log(err);
    } finally {
      setIsTyping(false);
    }
  };
  const handleLogOut = () => {
    setAccessToken("");
    Cookies.remove("accessToken");
    setName("");
    setIsLogIn(false);
    setIsAnalyze(false);
    toast.success("Log out Successful");
  };
  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      setAccessToken(token);
      setIsLogIn(true);
      getName(token);
      getPost(token);
    }
  }, []);
  return (
    <div className="flex gap-5">
      <div className="h-screen w-[20%]">
        <Layout name={name} />
      </div>
      <div className="h-screen w-full">
        <div className="h-[7%] font-bold text-2xl flex justify-between items-center mx-5">
          <div>EmoAssist</div>
          {isLogIn ? (
            <button
              className="text-xl bg-red-700 text-white h-10 w-24"
              onClick={() => handleLogOut()}
            >
              LogOut
            </button>
          ) : (
            <div className="text-xl">
              <LoginSocialFacebook
                appId="596398019612528"
                onResolve={(e) => handleSocialLoginSuccess(e)}
                onReject={(e) => handleSocialLoginError(e)}
              >
                <FacebookLoginButton text="Log In" />
              </LoginSocialFacebook>
            </div>
          )}
        </div>
        <div className="w-full h-[85%] flex justify-center items-center">
          <div className="w-[80%] overflow-y-auto h-[83%] flex flex-col">
            {isAnalyze && (
              <>
                <div className="w-[90%] mb-3">
                  <span className="font-bold">EmoAssist:</span> Hello! Here's an
                  analysis of your recent social media posts, along with the
                  detected sentiments for each—helping you better understand
                  your emotional tone online.
                </div>
                <table className="border-collapse bg-[#f0f4f9] border border-gray-300 w-[90%] my-3">
                  <thead>
                    <tr>
                      <th className="text-left pl-5 w-3/4">Text</th>
                      <th className="text-left pl-5 w-1/4">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nameState.map((a, idx) => {
                      return (
                        <tr key={idx}>
                          <th className="text-left text-sm font-normal pl-5 py-3">
                            {a}
                          </th>
                          <th className="text-left text-sm font-normal pl-5 py-3">
                            {sentiments[idx]}
                          </th>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <table className="border-collapse bg-[#f0f4f9] border border-gray-300 w-[90%] my-3">
                  <thead>
                    <tr>
                      <th className="text-left pl-5 w-3/4">Images</th>
                      <th className="text-left pl-5 w-1/4">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urlState.map((a, idx) => {
                      return (
                        <tr key={idx}>
                          <th className="text-left text-sm font-normal pl-5 py-3">
                            <img src={a} className="h-32 w-32" alt="1" />
                          </th>
                          <th className="text-left text-sm font-normal pl-5 py-3">
                            {sentimentsImg[idx]}
                          </th>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <BarGraph
                  labels={labels}
                  probabilities={probabilities}
                  context={"Text"}
                />
                <BarGraph
                  labels={imgLabels}
                  probabilities={probabilitiesImg}
                  context={"Image"}
                />
              </>
            )}
          </div>
        </div>
        <InputBox handlePost={handlePost} isLogIn={isLogIn} />
      </div>
      {isTyping && (
        <div className="absolute z-10 bottom-24 left-[50vw]">
          Med Assists is typing.......
        </div>
      )}
    </div>
  );
}
