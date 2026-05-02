'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Quote, Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-[150px]',
  className = ''
}: {
  value: string,
  onChange: (val: string) => void,
  placeholder: string,
  minHeight?: string,
  className?: string
}) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [dictationLang, setDictationLang] = useState('id-ID'); // Default to Indonesian
  const [dictationError, setDictationError] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: clsx('prose-custom max-w-none focus:outline-none w-full bg-transparent border-none p-0 text-[#2c2c2c]', minHeight, className),
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = dictationLang;

        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript && editor) {
            editor.chain().focus().insertContent(finalTranscript).run();
            setDictationError(''); // clear any previous errors on success
          }
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);

          if (event.error === 'network') {
            setDictationError('Dictation requires an active internet connection and a supported browser (Chrome/Edge/Safari).');
          } else if (event.error === 'not-allowed') {
            setDictationError('Microphone access denied.');
          } else {
            setDictationError('Dictation error: ' + event.error);
          }

          // Clear the error message after 5 seconds
          setTimeout(() => setDictationError(''), 5000);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [editor, dictationLang]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setDictationError('');
      recognition?.start();
      setIsListening(true);
    }
  };

  if (!editor) {
    return <div className={clsx("w-full bg-transparent p-0 text-[#2c2c2c]", minHeight, className)} />;
  }

  return (
    <div className="relative w-full group">
      {dictationError && (
        <div className="absolute -top-12 right-0 bg-[#e74c3c]/10 text-[#e74c3c] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full animate-fade-in z-20">
          {dictationError}
        </div>
      )}

      {recognition && (
        <div className="absolute -top-10 right-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 print:hidden z-10">
          <button
            onClick={() => {
              const newLang = dictationLang === 'id-ID' ? 'en-US' : 'id-ID';
              setDictationLang(newLang);
              if (isListening) {
                recognition.stop();
                setTimeout(() => {
                  // Wait for the effect to recreate the recognition instance before restarting
                  setIsListening(false);
                }, 100);
              }
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A6B] hover:text-[#2c2c2c] bg-[#EBE5DA]/50 hover:bg-[#EBE5DA] px-2 py-1 rounded-full transition-colors"
            title="Toggle Language"
          >
            {dictationLang === 'id-ID' ? 'ID' : 'EN'}
          </button>
          <button
            onClick={toggleListening}
            className={clsx(
              "p-2 rounded-full transition-colors",
              isListening ? "text-[#e74c3c] bg-[#e74c3c]/10 animate-pulse opacity-100" : "text-[#C4BCB3] hover:text-[#8C7A6B] hover:bg-[#EBE5DA]"
            )}
            title={isListening ? "Listening..." : "Dictate"}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>
      )}

      {editor && (
        <BubbleMenu editor={editor} className="flex bg-[#1a1a1a] shadow-xl rounded-xl overflow-hidden px-2 py-1 space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={clsx("p-1.5 rounded-lg text-white hover:bg-[#333] transition-colors", editor.isActive('bold') && 'bg-[#333]')}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={clsx("p-1.5 rounded-lg text-white hover:bg-[#333] transition-colors", editor.isActive('italic') && 'bg-[#333]')}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={clsx("p-1.5 rounded-lg text-white hover:bg-[#333] transition-colors", editor.isActive('blockquote') && 'bg-[#333]')}
          >
            <Quote className="w-4 h-4" />
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="w-full" />
    </div>
  );
}
