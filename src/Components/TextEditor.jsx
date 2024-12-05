import React, { useCallback, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "./TextEditor.css";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const TextEditor = () => {
  const { id } = useParams();
  const [userCount, setUserCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  const editorWrapper = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    console.log(wrapper);
    const editor = document.createElement("div");
    wrapper.append(editor);
    const quillInstance = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ header: 1 }, { header: 2 }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ["clean"],
          ["link", "image", "video"],
        ],
      },
    });
    quillInstance.disable();
    quillInstance.setText("Loading...");
    setQuill(quillInstance);
  }, []);
  useEffect(() => {
    if (!socket || !quill) return;
    socket.on("total-user", (totalUsers) => {
      setUserCount(totalUsers);
    });
  }, [socket, quill, id]);

  // Getting document data or Creating it
  useEffect(() => {
    if (!socket || !quill) return;
    socket.once("load-document", (document) => {
      quill.setContents(document.data);
      setUserCount(document.users);
      quill.enable();
    });
    socket.emit("get-document", id);
  }, [socket, quill, id]);

  useEffect(() => {
    if (!socket || !quill) return;
    const interval = setInterval(() => {
      socket.emit("save-changes", quill.getContents());
    }, 2000);
    return () => clearInterval(interval);
  }, [socket, quill]);
  useEffect(() => {
    // const socketInstance = io('http://localhost:3000', {query:{id}});
    const socketInstance = io(
      "backedcollaborativetextedior-production.up.railway.app",
      { query: { id } }
    );
    setSocket(socketInstance);
    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });
    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
    });
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta) => {
      quill.updateContents(delta);
      quill.setSelection(quill.getLength());
    };
    socket.on("receive-changes", handler);
    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  const printWithPageBreak = () => {
    const editorContent = quill.root.innerHTML;

    // Create a print container dynamically
    const printContainer = document.createElement("div");
    printContainer.id = "print-container";
    printContainer.innerHTML = editorContent;

    // Append it to the body
    document.body.appendChild(printContainer);

    // Add dynamic page breaks
    addPageBreaks(printContainer);

    // Trigger print
    window.print();

    // Remove print container from DOM
    document.body.removeChild(printContainer);
  }
  const addPageBreaks = (container) => {
    const pageHeight = 1122; // A4 size at 96 DPI (approx.)
    const contentChildren = Array.from(container.children);
    let currentHeight = 0;

    contentChildren.forEach((child, index) => {
        if(index == 0) {
            return
        }
      const childHeight = child.offsetHeight;
      currentHeight += childHeight;

      if (currentHeight > pageHeight) {
        // Insert a page-break div before this child
        const pageBreak = document.createElement("div");
        pageBreak.className = "page-break";
        container.insertBefore(pageBreak, child);
        currentHeight = childHeight; // Reset height counter
      }
    });
  };

  return (
    <>
      <div className="editor-container" ref={editorWrapper}></div>
      <button id="printBtn" onClick={printWithPageBreak}>
        Print
      </button>
      <button id="counter">{userCount}</button>
    </>
  );
};

export default TextEditor;
