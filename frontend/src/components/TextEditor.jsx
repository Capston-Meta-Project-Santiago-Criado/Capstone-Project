// starter code from https://www.npmjs.com/package/react-quilljs
import { BASE_URL } from "../lib/utils";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { EDITOR_PERMS } from "../lib/constants";
import { FileText, CheckCircle } from "lucide-react";

const AUTOSAVE_DELAY = 2000; // ms of inactivity before auto-saving

const TextEditor = ({ viewerPermissions }) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["clean"],
    ],
  };
  const { id } = useParams();
  const [value, setValue] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "unsaved" | "saving"
  const saveTimer = useRef(null);
  const canEdit = viewerPermissions === EDITOR_PERMS;

  useEffect(() => {
    const getCurrentDoc = async () => {
      const response = await fetch(`${BASE_URL}/portfolios/getNotes/${id}`, {
        method: "GET",
        credentials: "include",
      });
      setValue(await response.json());
    };
    getCurrentDoc();
  }, [id]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const doSave = async (html) => {
    setSaveStatus("saving");
    const response = await fetch(`${BASE_URL}/portfolios/setNotes/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    if (response.ok) setSaveStatus("saved");
  };

  const handleChange = (content, delta, source, editor) => {
    const html = editor.getHTML();
    setValue(html);
    setSaveStatus("unsaved");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(html), AUTOSAVE_DELAY);
  };

  const isEmpty = !value || value === "<p><br></p>" || value === "";

  return (
    <div className="bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="text-lg font-bold text-white">Notes</h2>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-gray-400">
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-yellow-500/80 font-medium">Unsaved changes</span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>
        )}

        {!canEdit && (
          <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded-md border border-white/8">
            Read only
          </span>
        )}
      </div>

      {/* Editor */}
      {canEdit ? (
        <div className="[&_.ql-toolbar]:bg-[#13131a] [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/8 [&_.ql-toolbar]:px-4 [&_.ql-toolbar]:py-2 [&_.ql-container]:border-0 [&_.ql-container]:bg-[#0f0f14] [&_.ql-editor]:text-gray-200 [&_.ql-editor]:text-sm [&_.ql-editor]:leading-relaxed [&_.ql-editor]:min-h-56 [&_.ql-editor]:p-5 [&_.ql-stroke]:stroke-gray-400 [&_.ql-fill]:fill-gray-400 [&_.ql-picker-label]:text-gray-400 [&_.ql-editor.ql-blank::before]:text-gray-600 [&_.ql-editor.ql-blank::before]:not-italic [&_.ql-editor]:focus:outline-none [&_.ql-editor_blockquote]:border-l-2 [&_.ql-editor_blockquote]:border-emerald-500/50 [&_.ql-editor_blockquote]:pl-4 [&_.ql-editor_blockquote]:text-gray-400 [&_.ql-editor_ol]:pl-4 [&_.ql-editor_ul]:pl-4 [&_.ql-formats]:mr-2">
          <ReactQuill
            theme="snow"
            value={value}
            onChange={handleChange}
            modules={modules}
            placeholder="Add notes about this portfolio — investment thesis, reminders, research…"
          />
        </div>
      ) : (
        <div className="px-5 py-4 min-h-40">
          {isEmpty ? (
            <p className="text-gray-600 text-sm italic">No notes yet.</p>
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed [&_strong]:text-white [&_em]:text-gray-300 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500/50 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TextEditor;
