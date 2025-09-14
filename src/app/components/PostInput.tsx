import { useState, useRef } from 'react';
import { FaPhotoVideo, FaSmile, FaUserTag, FaMapMarkerAlt, FaEllipsisH } from 'react-icons/fa';
import { FiMoreHorizontal } from 'react-icons/fi';

interface PostInputProps {
  user: {
    name: string;
    avatar: string;
  };
  onPostSubmit?: (content: string) => void;
  placeholder?: string;
}

const PostInput: React.FC<PostInputProps> = ({ 
  user, 
  onPostSubmit, 
  placeholder = "What's on your mind?" 
}) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (content.trim() && onPostSubmit) {
      onPostSubmit(content);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="post-input-container">
      <div className="post-input-card">
        <div className="post-input-header">
          <div className="user-info">
            <img src={user.avatar} alt={user.name} className="user-avatar" />
            <span className="user-name">{user.name}</span>
          </div>
          <button className="more-options-btn">
            <FiMoreHorizontal />
          </button>
        </div>
        
        <div className={`input-container ${isFocused ? 'focused' : ''}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="post-textarea"
            rows={1}
          />
        </div>
        
        {content && (
          <div className="post-preview">
            <p>{content}</p>
          </div>
        )}
        
        <div className="add-to-post">
          <span className="add-to-post-label">Add to your post</span>
          <div className="add-to-post-options">
            <button className="post-option-btn" aria-label="Photo/Video">
              <FaPhotoVideo className="photo-icon" />
            </button>
            <button className="post-option-btn" aria-label="Feeling/Activity">
              <FaSmile className="smile-icon" />
            </button>
            <button className="post-option-btn" aria-label="Tag People">
              <FaUserTag className="tag-icon" />
            </button>
            <button className="post-option-btn" aria-label="Check In">
              <FaMapMarkerAlt className="location-icon" />
            </button>
            <button className="post-option-btn" aria-label="More Options">
              <FaEllipsisH className="more-icon" />
            </button>
          </div>
        </div>
        
        <div className="post-actions">
          <button 
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={`post-btn ${content.trim() ? 'active' : ''}`}
          >
            Post
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .post-input-container {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .post-input-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
          padding: 16px;
          transition: box-shadow 0.3s ease;
        }
        
        .post-input-card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .post-input-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 10px;
          border: 1px solid #e4e6eb;
        }
        
        .user-name {
          font-weight: 600;
          color: #050505;
          font-size: 16px;
        }
        
        .more-options-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #65676b;
          padding: 6px;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        
        .more-options-btn:hover {
          background-color: #f0f2f5;
        }
        
        .input-container {
          border: 1px solid #e4e6eb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .input-container.focused {
          border-color: #1877f2;
          box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
        }
        
        .post-textarea {
          width: 100%;
          border: none;
          resize: none;
          outline: none;
          font-size: 18px;
          line-height: 1.4;
          color: #050505;
          min-height: 40px;
          max-height: 150px;
          font-family: inherit;
        }
        
        .post-textarea::placeholder {
          color: #8a8d91;
        }
        
        .post-preview {
          background: #f0f2f5;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        
        .post-preview p {
          margin: 0;
          color: #050505;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .add-to-post {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-top: 1px solid #e4e6eb;
          border-bottom: 1px solid #e4e6eb;
          margin-bottom: 16px;
        }
        
        .add-to-post-label {
          font-size: 15px;
          font-weight: 600;
          color: #65676b;
        }
        
        .add-to-post-options {
          display: flex;
          gap: 8px;
        }
        
        .post-option-btn {
          background: none;
          border: none;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
          color: #65676b;
        }
        
        .post-option-btn:hover {
          background-color: #f0f2f5;
        }
        
        .photo-icon {
          color: #41b35d;
        }
        
        .smile-icon {
          color: #eab026;
        }
        
        .tag-icon {
          color: #1877f2;
        }
        
        .location-icon {
          color: #f3425f;
        }
        
        .more-icon {
          color: #65676b;
        }
        
        .post-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .post-btn {
          background-color: #e4e6eb;
          color: #bcc0c4;
          border: none;
          border-radius: 6px;
          padding: 8px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .post-btn.active {
          background-color: #1877f2;
          color: white;
        }
        
        .post-btn.active:hover {
          background-color: #166fe5;
        }
      `}</style>
    </div>
  );
};

export default PostInput;
