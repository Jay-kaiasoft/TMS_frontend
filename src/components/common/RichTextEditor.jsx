import React from 'react';
import { Controller } from 'react-hook-form';

// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Require Editor JS files.
import 'froala-editor/js/plugins.pkgd.min.js';

import FroalaEditorComponent from 'react-froala-wysiwyg';

const baseConfig = {
    placeholderText: 'Enter ticket description...',
    charCounterCount: false,
    quickInsertEnabled: false,
    heightMin: 150,
};

const RichTextEditor = ({ name, control, label, rules, className = '', minimal = false }) => {
    const editorConfig = {
        ...baseConfig,
        toolbarButtons: minimal
            ? [
                'bold', 'italic', 'underline', 'strikeThrough', '|',
                'formatOL', 'formatUL', '|',
                'undo', 'redo', 'clearFormatting'
            ]
            : [
                'bold', 'italic', 'underline', 'strikeThrough', '|',
                'fontFamily', 'fontSize', 'textColor', 'backgroundColor', '|',
                'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', '|',
                'formatOL', 'formatUL', '|',
                'undo', 'redo', 'clearFormatting'
            ]
    };
    return (
        <div className={`flex flex-col mb-4 ${className}`}>
            {/* {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>} */}
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <div className={`flex flex-col ${error ? 'border-red-500' : 'border-[#DFE1E6]'} rounded-md hover:border-[#8993A4] transition-colors focus-within:border-[#0052CC]`}>
                        <FroalaEditorComponent
                            tag='textarea'
                            config={editorConfig}
                            model={value || ''}
                            onModelChange={onChange}
                        />
                        {error && <p className="text-red-500 text-xs mt-1 p-1 px-4">{error.message}</p>}
                    </div>
                )}
            />
        </div>
    );
};

export default RichTextEditor;
