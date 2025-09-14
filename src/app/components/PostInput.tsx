import { useState, useRef, useEffect } from 'react';
import { FaPhotoVideo, FaSmile, FaUserTag, FaMapMarkerAlt, FaEllipsisH, FaTimes } from 'react-icons/fa';
import { FiMoreHorizontal } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface PostInputProps {
  user: User;
  onPostSubmit?: (content: string, images: string[]) => void;
  placeholder?: string;
  friends?: User[]; // For tagging functionality
}

const PostInput: React.FC<PostInputProps> = ({ 
  user, 
  onPostSubmit, 
  placeholder = "What's on your mind?",
  friends = []
}) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample emojis for the emoji picker
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😭', '😡', '👍', '❤️', '🔥', '👏', '🎉'];

  const handleSubmit = () => {
    if ((content.trim() || images.length > 0) && onPostSubmit) {
      onPostSubmit(content, images);
      setContent('');
      setImages([]);
      setTaggedUsers([]);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleTagUser = (user: User) => {
    if (!taggedUsers.some(u => u.id === user.id)) {
      setTaggedUsers(prev => [...prev, user]);
      setContent(prev => prev + ` @${user.name}`);
    }
    setShowTagging(false);
    setTagSearch('');
  };

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

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
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="post-textarea"
            rows={1}
          />
        </div>
        
        {showTagging && (
          <div className="tagging-container">
            <input
              type="text"
              placeholder="Search friends to tag..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="tag-search-input"
            />
            <div className="tagging-results">
              {filteredFriends.map(friend => (
                <div 
                  key={friend.id} 
                  className="tagging-result-item"
                  onClick={() => handleTagUser(friend)}
                >
                  <img src={friend.avatar} alt={friend.name} className="tagging-avatar" />
                  <span>{friend.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {images.length > 0 && (
          <div className="image-preview-container">
            {images.map((img, index) => (
              <div key={index} className="image-preview">
                <img src={img} alt={`Preview ${index}`} />
                <button className="remove-image-btn" onClick={() => removeImage(index)}>
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {showEmojiPicker && (
          <div className="emoji-picker">
            {emojis.map((emoji, index) => (
              <button 
                key={index} 
                className="emoji-btn"
                onClick={() => addEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <div className="add-to-post">
          <span className="add-to-post-label">Add to your post</span>
          <div className="add-to-post-options">
            <button 
              className="post-option-btn" 
              aria-label="Photo/Video"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaPhotoVideo className="photo-icon" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
            </button>
            
            <button 
              className="post-option-btn" 
              aria-label="Feeling/Activity"
              onClick={() => setShowEmojiPicker(prev => !prev)}
            >
              <FaSmile className="smile-icon" />
            </button>
            
            <button 
              className="post-option-btn" 
              aria-label="Tag People"
              onClick={() => setShowTagging(prev => !prev)}
            >
              <FaUserTag className="tag-icon" />
            </button>
            
            <button 
              className="post-option-btn" 
              aria-label="Check In"
              onClick={() => alert("Location feature would open here")}
            >
              <FaMapMarkerAlt className="location-icon" />
            </button>
            
            <button 
              className="post-option-btn" 
              aria-label="More Options"
              onClick={() => alert("More options would appear here")}
            >
              <FaEllipsisH className="more-icon" />
            </button>
          </div>
        </div>
        
        <div className="post-actions">
          <button 
            onClick={handleSubmit}
            disabled={!content.trim() && images.length === 0}
            className={`post-btn ${(content.trim() || images.length > 0) ? 'active' : ''}`}
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
        
        .tagging-container {
          border: 1px solid #e4e6eb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          background: white;
        }
        
        .tag-search-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #dddfe2;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .tagging-results {
          max-height: 150px;
          overflow-y: auto;
        }
        
        .tagging-result-item {
          display: flex;
          align-items: center;
          padding: 8px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .tagging-result-item:hover {
          background-color: #f0f2f5;
        }
        
        .tagging-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 10px;
        }
        
        .image-preview-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .image-preview {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1;
        }
        
        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .remove-image-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        }
        
        .emoji-picker {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          padding: 8px;
          border: 1px solid #e4e6eb;
          border-radius: 8px;
          margin-bottom: 12px;
          background: white;
        }
        
        .emoji-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .emoji-btn:hover {
          background-color: #f0f2f5;
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
          position: relative;
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
