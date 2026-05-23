'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR
const CKEditorComponent = dynamic(
  () => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor),
  { ssr: false }
);

const ClassicEditor = dynamic(
  () => import('@ckeditor/ckeditor5-build-classic'),
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <textarea
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter product description..."
      />
    );
  }

  return (
    <CKEditorComponent
      editor={ClassicEditor}
      data={value}
      onChange={(_event: any, editor: any) => {
        const data = editor.getData();
        onChange(data);
      }}
      config={{
        toolbar: [
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'link',
          'blockQuote',
          'insertTable',
          '|',
          'undo',
          'redo'
        ],
        heading: {
          options: [
            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
          ]
        }
      }}
    />
  );
}
