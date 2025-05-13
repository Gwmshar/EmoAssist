import axios from "axios";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
export default function Layout({
  name,
  isChat,
  handleHistory,
  setSessionName,
  setSessionId,
  setChats,
}) {
  const [session, setSession] = useState([]);
  const logOut = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "/login";
  };
  const getSession = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const data = await axios.get(
        `http://127.0.0.1:5000/getSessions?userId=${userId}`
      );
      setSession(data.data);
    } catch (err) {
      console.log("Error in client");
    }
  };

  useEffect(() => {
    getSession();
  }, []);
  return (
    <div className={`h-full flex-col flex bg-[#f0f4f9] gap-5 w-full`}>
      <div className="flex flex-col">
        <div className="flex justify-center items-center mt-5">
          <div className="h-48 w-48 rounded-full bg-white flex justify-center items-center">
            <FontAwesomeIcon
              icon={faUser}
              className="h-2/4 w-2/4 text-blue-500"
            />
          </div>
        </div>
        {name != "" ? (
          <div className="text-center text-xl my-3 font-bold">{name}</div>
        ) : (
          <div className="text-center my-3">Profile Name</div>
        )}
        <div className="h-full w-full flex justify-center items-center">
          <div className="bg-slate-300 h-1 w-3/4"></div>
        </div>
      </div>
      <div className={`flex items-center flex-col gap-5 w-full`}>
        <div className="cursor-pointer">
          <Link to={"/"}>Home</Link>
        </div>
        <div className="cursor-pointer">
          <Link to={"/chat"}>Chatbot</Link>
        </div>
        <div className="cursor-pointer text-red-500" onClick={logOut}>
          Log Out
        </div>
      </div>
      {isChat && (
        <>
          <div className="flex justify-center items-center">
            <div className="text-center underline w-3/4 pl-5">Recent</div>
            <FontAwesomeIcon
              icon={faPlus}
              onClick={() => {
                setChats("");
                setSessionName("");
              }}
              className="text-xl cursor-pointer"
            />
          </div>
          <div className=" w-full h-[40%] overflow-y-auto">
            <div className="flex flex-col justify-center items-center mx-4 gap-3">
              {session?.map((a, idx) => {
                return (
                  <div
                    key={idx}
                    className="cursor-pointer text-blue-400"
                    onClick={() => {
                      setSessionId(a.session_id);
                      setSessionName(a.text);
                      handleHistory(a.session_id);
                    }}
                  >
                    {a.text}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

{
  /* <div className="flex sticky top-0 justify-between items-center mb-2 mx-2">
  <input
    type="text"
    placeholder="Session name"
    className="w-[70%]"
    value={text}
    onChange={(e) => settext(e.target.value)}
  />
  <button className="w-10 h-10" onClick={() => handleAdd()}>
    Add
  </button>
</div>; */
}
