import React, { useCallback, useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import "./TextEditor.css"
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const TextEditor = () => {

    const {id} = useParams();
    const [socket, setSocket] = useState(null);
    const [quill, setQuill] = useState(null);

const editorWrapper = useCallback((wrapper) =>{
    if (wrapper == null) return
    wrapper?.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const quillInstance = new Quill(editor, {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean'],
                ['link', 'image', 'video'],
            ]
        }
    })
    quillInstance.disable()
    quillInstance.setText('Loading...')
    setQuill(quillInstance);
}, [])
    // Getting document data or Creating it 
    useEffect(() => {
        if (!socket || !quill) return;
        socket.once('load-document', documentData => {
            console.log(documentData);
            quill.setContents(documentData)
            quill.enable();
        })
        socket.emit('get-document', id)
    }, [socket, quill, id])

    useEffect(() => {
        if (!socket || !quill) return;
        const interval = setInterval(() => {
            socket.emit('save-changes', quill.getContents())
        }, 2000)
        return () => clearInterval(interval)
    }, [socket, quill])
    // Initialize the Quill editor
    // useEffect(() => {
    //     const editor = document.createElement('div');
    //     editorWrapper.current.append(editor);
    //     const quillInstance = new Quill(editor, {
    //         theme: 'snow',
    //         modules: {
    //             toolbar: [
    //                 ['bold', 'italic', 'underline', 'strike'],
    //                 ['blockquote', 'code-block'],
    //                 [{ 'header': 1 }, { 'header': 2 }],
    //                 [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    //                 [{ 'script': 'sub' }, { 'script': 'super' }],
    //                 [{ 'indent': '-1' }, { 'indent': '+1' }],
    //                 [{ 'direction': 'rtl' }],
    //                 [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    //                 [{ 'color': [] }, { 'background': [] }],
    //                 [{ 'font': [] }],
    //                 [{ 'align': [] }],
    //                 ['clean'],
    //                 ['link', 'image', 'video'],
    //             ]
    //         }
    //     })
    //     quillInstance.disable()
    //     quillInstance.setText('Loading...')
    //     setQuill(quillInstance);
    //     return () => {
    //         editorWrapper.current.innerHTML = '';
    //     }
    // }, []);
    
    // initialize the socket
    useEffect(() => {
        const socketInstance = io('backedcollaborativetextedior-production.up.railway.app');
        setSocket(socketInstance)
        socketInstance.on('connect', () => {
          console.log('Connected to server');
        });
        socketInstance.on('disconnect', () => {
          console.log('Disconnected from server');
        });
        return () => {
            socketInstance.disconnect();
        };
    },[])

    useEffect(() => {
        if (!socket || !quill) return 
        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return 
            socket.emit('send-changes', delta);
        } 
        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        }
    }, [socket, quill]);


    useEffect(() => {
        if (!socket || !quill) return 

        const handler = (delta) => {
            quill.updateContents(delta);
        }
        socket.on('receive-changes', handler)
        return () => {
            socket.off('receive-changes', handler);
        }
    }, [socket, quill]);

  return (
    <>
    <div className='editor-container' ref={editorWrapper}>
    </div>
    <button id='printBtn' onClick={() => window.print()}>Print</button>
    </>
  )
}

export default TextEditor