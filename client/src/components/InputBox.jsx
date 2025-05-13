import { useState, useEffect, useRef } from "react";

export default function InputBox({ text, setText, handlePost }) {
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
          <form action="" onSubmit={() => handlePost(e)}>
            <button className="w-16">Send</button>
          </form>
          <button className="w-16">UP</button>
        </div>
      </div>
    </div>
  );
}
