import { useState, useEffect, useRef } from "react";

export default function InputBox({ isLogIn, handlePost }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
  }, [text]);
  const handleInputChange = (event) => {
    setText(event.target.value);
  };
  return (
    <div className="fixed bottom-5 w-3/4 flex justify-center items-center">
      <div className="w-full">
        <div className="relative border bg-[#f0f4f9] w-full rounded-[2.0rem] flex justify-center items-center p-4 space-x-2">
          <textarea
            disabled={true}
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            rows={1}
            className="w-[85%] outline-0 text-xl bg-[#f0f4f9] resize-none overflow-hidden"
            placeholder="Type here..."
            style={{
              maxHeight: "500px",
              overflowY: "auto",
            }}
          />
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
    </div>
  );
}
