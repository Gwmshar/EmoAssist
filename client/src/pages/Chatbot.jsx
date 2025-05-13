import React, { useState, useRef, useEffect } from "react";
import Layout from "./Layout";
import InputBox from "../components/InputBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faImage } from "@fortawesome/free-solid-svg-icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import axios from "axios";

export default function Chatbot({ name }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState([]);
  const [opt, setOpt] = useState("ChatV1");
  const [isOpen, setIsOpen] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [image, setImage] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isRefresh, setIsRefresh] = useState(false);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  useEffect(() => {
    setText(transcript);
  }, [transcript]);
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
  }, [text]);
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/chatbot/reset");
  }, []);
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      window.location.href = "/login";
    }
  }, []);
  const handleInputChange = (event) => {
    setText(event.target.value);
  };
  const handlePost = async (e) => {
    setIsTyping(true);
    const userId = localStorage.getItem("userId");
    try {
      let data;
      let chat;
      let session_id;
      if (sessionId == "") {
        console.log("Why");
        data = await axios.post(
          `http://127.0.0.1:5000/chatbot/addSession?userId=${userId}`,
          {
            text,
          }
        );
        setSessionId(data.data.id);
        session_id = data.data.id;
      } else {
        session_id = sessionId;
      }

      if (opt == "ChatV1") {
        data = await axios.post(
          `http://127.0.0.1:5000/chatbot/?userId=${userId}`,
          { text, session_id: session_id }
        );
        chat = {
          you: text,
          emo: data.data.answer,
        };
      } else if (opt == "ChatV2") {
        data = await axios.post(
          `http://127.0.0.1:5000/chat/ask?userId=${userId}`,
          { session_id: session_id, text }
        );

        chat = {
          you: text,
          emo: data.data.emo,
        };
      }

      setChats((e) => [...e, chat]);
      setText("");
    } catch (er) {
      console.log(er);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      setImage(fileReader.result);
    };
    fileReader.onerror = () => {
      console.log("error");
    };
  };
  const handleUpload = async () => {
    setIsTyping(true);
    const userId = localStorage.getItem("userId");
    try {
      let session_id = sessionId;
      const res = await axios.post(
        `http://127.0.0.1:5000/chatImg?userId=${userId}`,
        {
          session_id,
          image,
        }
      );
      let chat = {
        you: image,
        emo: res.data.emo,
        isImg: true,
      };
      setChats((e) => [...e, chat]);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };
  const handleHistory = async (id) => {
    try {
      const userId = localStorage.getItem("userId");
      const data = await axios.get(
        `http://127.0.0.1:5000/chatbot/conversation?userId=${userId}&sessionId=${id}`
      );
      setChats([]);
      if (data.data.status) {
        setChats(data.data.conversation);
      }
    } catch (err) {
      console.log("Error in client");
    }
  };

  return (
    <div className="flex gap-5">
      <div className="h-screen w-[20%]">
        <Layout
          name={name}
          isChat={true}
          handleHistory={handleHistory}
          setSessionName={setSessionName}
          setSessionId={setSessionId}
          setChats={setChats}
        />
      </div>
      <div className="h-screen w-full">
        <div className="h-[7%] font-bold text-2xl flex justify-between items-center mx-5">
          <div>EmoAssist</div>
          <div className="text-sm font-normal">{sessionName}</div>
          <select
            name=""
            id=""
            className="text-sm font-normal"
            value={opt}
            onChange={(e) => setOpt(e.target.value)}
          >
            <option value="ChatV1">ChatV1</option>
            <option value="ChatV2">ChatV2</option>
          </select>
        </div>
        <div className="w-full h-[85%] flex justify-center items-center">
          <div className="w-[80%] overflow-y-auto h-[83%] flex flex-col gap-2">
            {chats.length != 0 &&
              chats.map((a, idx) => {
                return (
                  <div key={idx} className="my-2">
                    <div className="flex justify-end items-end my-2">
                      {a.isImg ? (
                        <img src={a.you} />
                      ) : (
                        <div className="bg-[#f0f4f9] px-3 py-3">{a.you}</div>
                      )}
                    </div>
                    <div className="flex justify-start items-start my-2">
                      {a.emo}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="fixed bottom-5 w-3/4 flex justify-center items-center">
          <div className="w-full">
            <div className="relative border bg-[#f0f4f9] w-full rounded-[2.0rem] flex justify-center items-center p-4 space-x-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInputChange}
                rows={1}
                className="w-[85%] outline-0 bg-[#f0f4f9] resize-none overflow-hidden"
                placeholder="Type here..."
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              />
              <button className="w-16" onClick={() => handlePost()}>
                Send
              </button>
              <FontAwesomeIcon
                icon={faImage}
                className="cursor-pointer text-xl px-2"
                onClick={() => {
                  setIsOpen((prev) => !prev);
                }}
              />
              <FontAwesomeIcon
                icon={faMicrophone}
                onClick={SpeechRecognition.startListening}
                className="cursor-pointer px-2"
              />
              {isOpen && (
                <div className="absolute bottom-24 right-5 flex justify-center items-center z-20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImage(e)}
                  />
                  <button className="w-16" onClick={handleUpload}>
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isTyping && (
        <div className="absolute z-10 bottom-24 left-[50vw]">
          EmoAssist is typing.......
        </div>
      )}
      {listening && (
        <div className="absolute z-10 bottom-24 left-[50vw]">
          EmoAssist is listening.......
        </div>
      )}
    </div>
  );
}
