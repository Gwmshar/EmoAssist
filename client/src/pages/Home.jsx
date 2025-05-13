import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { FacebookLoginButton } from "react-social-login-buttons";
import { LoginSocialFacebook } from "reactjs-social-login";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-hot-toast";
import BarGraph from "../components/BarGraph";

export default function Home({ name, login }) {
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
  const [resText, setResText] = useState("");
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
    "Neutral",
  ];
  const handleSocialLoginSuccess = (res) => {
    const token = res.data.accessToken;
    getPost(token);
    setAccessToken(token);
    setIsLogIn(true);
    Cookies.set("accessToken", token, { expires: 3 });
    toast.success("Log In Successful");
  };
  const handleSocialLoginError = (err) => {
    console.log(err);
  };
  const getPost = (token) => {
    axios
      .get(
        `https://graph.facebook.com/v21.0/me/posts?fields=message,full_picture,created_time&access_token=${token}`
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
      if (a.message && a.message !== "") {
        let postTime = new Date(a.created_time);
        let currentTime = new Date();
        let diffDays = Math.floor(
          (currentTime - postTime) / (1000 * 60 * 60 * 24)
        );
        let diffMonths = Math.ceil(diffDays / 30);
        let adjustedTimeAgo = Math.max(1, 7 - diffMonths);
        name.push({ message: a.message, timeAgo: adjustedTimeAgo });
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
      const res = await axios.post("http://127.0.0.1:5000/text", { name });
      const resImg = await axios.post("http://127.0.0.1:5000/image", {
        name: urls,
      });

      const senti = res.data[0];
      const probF = res.data[1];
      const sentiImg = resImg.data.emotions;
      const probFImg = resImg.data.percentages;
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
        parseFloat((val / probFImg.length).toFixed(2))
      );
      const sortedIndices = probs
        .map((value, index) => ({ index, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      const sortedIndicesImg = probsImg
        .map((value, index) => ({ index, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      setSentiments(senti);
      setProbabilities(probs);
      setSentimetnsImg(sentiImg);
      setProbabilitiesImg(probsImg);
      setResText(generatedResponse(sortedIndices, sortedIndicesImg));
      setIsAnalyze(true);
    } catch (err) {
      console.log(err);
    } finally {
      setIsTyping(false);
    }
  };

  const resArray = {
    Depression:
      "Depression can be overwhelming, and I want you to know that your feelings are valid. You're not alone in this, even though it might feel that way. It can help to talk to someone you trust, whether it's a friend, family member, or a professional, because you deserve support. Taking small steps, like getting fresh air, listening to calming music, or even just acknowledging how you feel, can make a difference over time. Try to be kind to yourself—healing takes time, and it's okay to move at your own pace. If you're feeling really low, reaching out for professional help can be a strong and positive step toward feeling better. You matter, and you're not alone in this journey.",
    Anxiety:
      "Anxiety can be overwhelming, but please know that you're not alone. When anxious thoughts take over, it can help to pause and take slow, deep breaths—focusing on the present moment rather than worrying about the future. Sometimes, simple activities like taking a short walk, listening to calming music, or journaling your thoughts can help ease the tension. Talking to someone you trust can also provide relief and reassurance. Remember, your feelings are valid, and you don’t have to face them alone. If anxiety feels too much to handle, reaching out to a professional can be a helpful step. You are stronger than your anxiety, and you deserve peace and support.",
    Stress:
      "Stress can be exhausting, especially when it feels like there’s no escape. It might help to take a step back, breathe deeply, and focus on one thing at a time. Sometimes, even small breaks—like listening to music, taking a short walk, or practicing mindfulness—can make a difference. Talking to someone you trust can also help lighten the burden. Remember, you don’t have to do everything at once, and it’s okay to prioritize your well-being. Be kind to yourself, and if the stress feels overwhelming, seeking support from a professional can be a helpful step. You are doing your best, and that is enough.",
  };

  const generatedResponse = (text, img) => {
    let norm = 0;
    if (text[0].index == 3) {
      norm = 1;
    }
    let response = "";
    response = ` It looks like your image posts mostly reflects ${
      imgLabels[img[0].index]
    }, ${imgLabels[img[1].index]}, ${imgLabels[img[2].index]}.`;
    if (norm == 1) {
      response += ` Your text posts mostly reflect a normal mood. However, some of your posts also show signs of ${
        labels[text[1].index]
      } and ${labels[text[2].index]}.`;
    } else if (norm == 0) {
      response += ` Your text posts reflects a ${labels[text[0].index]} `;
    }
    let temp, temp2;
    temp = labels[text[0].index];
    temp2 = labels[text[1].index];

    if (temp != "Normal") {
      response += " " + resArray[temp];
    } else response += " " + resArray[temp2];
    return response;
  };

  const handleLogOut = () => {
    setAccessToken("");
    Cookies.remove("accessToken");
    setIsLogIn(false);
    setIsAnalyze(false);
    toast.success("Log out Successful");
  };
  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      setAccessToken(token);
      getPost(token);
    }
  }, []);
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      window.location.href = "/login";
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
                  detected sentiments and emotions for each—helping you better
                  understand your emotional tone online.
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
                            {a.message}
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
                      <th className="text-left pl-5 w-1/4">Emotion</th>
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
                <div className="">{resText}</div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <button
            disabled={!isLogIn}
            onClick={() => handlePost()}
            className={`px-4 py-2 rounded-md ${
              isLogIn
                ? " text-black cursor-pointer"
                : " text-gray-500 cursor-not-allowed"
            }`}
          >
            Analyze
          </button>
        </div>
      </div>
      {isTyping && (
        <div className="absolute z-10 bottom-24 left-[50vw]">
          EmoAssist is typing.......
        </div>
      )}
    </div>
  );
}
