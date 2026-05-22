import React, { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Editor } from 'react-draft-wysiwyg';
import { ContentState, EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const htmlToEditorState = (html) => {
    const clean = (html || "").trim();
    if (!clean) return EditorState.createEmpty();
    try {
        const blocks = htmlToDraft(clean);
        if (blocks && blocks.contentBlocks) {
            const contentState = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
            return EditorState.createWithContent(contentState);
        }
    } catch (e) {
        console.error("Error parsing HTML to Draft state:", e);
    }
    return EditorState.createEmpty();
};

const editorStateToHtml = (state) => {
    if (!state) return "";
    try {
        return draftToHtml(convertToRaw(state.getCurrentContent()));
    } catch (e) {
        console.error("Error converting Draft state to HTML:", e);
        return "";
    }
};

const DraftEditorWrapper = ({ value, onChange, minimal, placeholder }) => {
    const [editorState, setEditorState] = useState(() => htmlToEditorState(value));
    const [lastHtml, setLastHtml] = useState(value || '');

    useEffect(() => {
        if (value !== lastHtml) {
            setEditorState(htmlToEditorState(value));
            setLastHtml(value || '');
        }
    }, [value, lastHtml]);

    const handleEditorChange = (state) => {
        setEditorState(state);
        const html = editorStateToHtml(state);
        setLastHtml(html);
        onChange(html);
    };

    const toolbarConfig = minimal
        ? {
            options: ['inline', 'list', 'history'],
            inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
            list: { options: ['unordered', 'ordered'] },
          }
        : {
            options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'history', 'remove'],
            inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
            list: { options: ['unordered', 'ordered'] },
            textAlign: { options: ['left', 'center', 'right', 'justify'] },
          };

    return (
        <Editor
            editorState={editorState}
            onEditorStateChange={handleEditorChange}
            toolbar={toolbarConfig}
            placeholder={placeholder || 'Enter description...'}
            wrapperClassName="editor-wrapper-custom w-full"
            editorClassName="editor-main-custom px-3 min-h-[150px] max-h-[300px] overflow-y-auto"
            toolbarClassName="editor-toolbar-custom"
        />
    );
};

const RichTextEditor = ({ name, control, label, rules, className = '', minimal = false, placeholder, value, onChange }) => {
    if (control) {
        return (
            <div className={`flex flex-col mb-4 ${className}`}>
                {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>}
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: { onChange: formOnChange, value: formValue }, fieldState: { error } }) => (
                        <div className={`flex flex-col ${error ? 'border-red-500' : 'border-[#DFE1E6]'} rounded-md hover:border-[#8993A4] transition-colors focus-within:border-[#0052CC]`}>
                            <DraftEditorWrapper
                                value={formValue}
                                onChange={formOnChange}
                                minimal={minimal}
                                placeholder={placeholder}
                            />
                            {error && <p className="text-red-500 text-xs mt-1 p-1 px-4">{error.message}</p>}
                        </div>
                    )}
                />
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div className="flex flex-col border border-[#DFE1E6] rounded-md hover:border-[#8993A4] transition-colors focus-within:border-[#0052CC]">
                <DraftEditorWrapper
                    value={value}
                    onChange={onChange}
                    minimal={minimal}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
