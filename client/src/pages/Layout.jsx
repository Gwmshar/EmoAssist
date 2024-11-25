import React, { useState } from "react";
export default function Layout({ name }) {
  return (
    <div className={`h-full flex-col flex bg-[#f0f4f9] gap-5 w-full`}>
      <div className="flex flex-col">
        <div className="flex justify-center items-center mt-5">
          <img
            className="h-48 w-48 rounded-full"
            src="https://images.unsplash.com/photo-1730305948811-a40b70800118?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxN3x8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />
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
        <div>Home</div>
        <div>AboutUs</div>
        <div>Terms and Conditions</div>
      </div>
    </div>
  );
}
