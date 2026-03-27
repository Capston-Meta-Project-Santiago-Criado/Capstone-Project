// starter code from https://www.npmjs.com/package/react-quilljs
import { BASE_URL } from "../lib/utils";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { EDITOR_PERMS } from "../lib/constants";

const TextEditor = ({ viewerPermissions }) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike", { list: "ordered" }, { list: "bullet" }],
    ],
  };
  const { id } = useParams();
  const [value, setValue] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const setChanges = (content, delta, source, editor) => {
    if (isSaved) setIsSaved(false);
    setValue(editor.getHTML());
  };

  const saveChanges = async () => {
    setIsSaving(true);
    const response = await fetch(`${BASE_URL}/portfolios/setNotes/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: value }),
    });
    if (response.ok) {
      setIsSaved(true);
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h2 className="text-lg font-bold text-white">Notes</h2>
        {viewerPermissions === EDITOR_PERMS && (
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            )}
            {!isSaved && !isSaving && (
              <button
                onClick={saveChanges}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors duration-200"
              >
                Save
              </button>
            )}
            {isSaved && !isSaving && (
              <span className="text-xs text-emerald-400 font-medium">Saved</span>
            )}
          </div>
        )}
      </div>
      <div className="h-80 [&_.ql-toolbar]:bg-white/5 [&_.ql-toolbar]:border-white/10 [&_.ql-toolbar]:border-b [&_.ql-container]:border-0 [&_.ql-editor]:text-gray-200 [&_.ql-editor]:min-h-full [&_.ql-stroke]:stroke-gray-400 [&_.ql-fill]:fill-gray-400 [&_.ql-picker-label]:text-gray-400">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={setChanges}
          modules={modules}
          className="h-full"
          readOnly={viewerPermissions !== EDITOR_PERMS}
        />
      </div>
    </div>
  );
};

export default TextEditor;
