import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { FaPhotoVideo, FaSmile, FaUserTag, FaMapMarkerAlt, FaEllipsisH, FaTimes, FaPaintBrush } from 'react-icons/fa';
import { FiMoreHorizontal } from 'react-icons/fi';
import { CREATE_POST } from './graphql/mutation';
// Define the GraphQL mutation


interface User {
  id: string;
  name: string;
  avatar: string;
}

interface PostInputProps {
  user: User;
  onPostSubmit?: (content: string, images: string[], taggedUsers: string[], background?: string ) => void;
  placeholder?: string;
  friends?: User[];
}

const PostInput: React.FC<PostInputProps> = ({ 
  user, 
  onPostSubmit, 
  placeholder = "What's on your mind?",
  friends = []
}) => {
  const [createPost, { loading, error }] = useMutation(CREATE_POST,{
    onCompleted:(e:any) =>{
      console.log(e);
    }
  });
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample emojis for the emoji picker
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😭', '😡', '👍', '❤️', '🔥', '👏', '🎉'];

  // Background options (colors and gradients)
  const backgroundOptions = [
    { id: 'default', value: null, label: 'Default', color: '#ffffff' },
    { id: 'blue', value: 'linear-gradient(135deg, #3498db, #2c3e50)', label: 'Blue Gradient' },
    { id: 'purple', value: 'linear-gradient(135deg, #9b59b6, #34495e)', label: 'Purple Gradient' },
    { id: 'red', value: 'linear-gradient(135deg, #e74c3c, #c0392b)', label: 'Red Gradient' },
    { id: 'green', value: 'linear-gradient(135deg, #2ecc71, #27ae60)', label: 'Green Gradient' },
    { id: 'orange', value: 'linear-gradient(135deg, #e67e22, #d35400)', label: 'Orange Gradient' },
    { id: 'yellow', value: 'linear-gradient(135deg, #f1c40f, #f39c12)', label: 'Yellow Gradient' },
    { id: 'solid-blue', value: '#3498db', label: 'Solid Blue' },
    { id: 'solid-purple', value: '#9b59b6', label: 'Solid Purple' },
    { id: 'solid-red', value: '#e74c3c', label: 'Solid Red' },
    { id: 'solid-green', value: '#2ecc71', label: 'Solid Green' },
  ];

  const handleSubmit = async () => {
    if ((content.trim() || images.length > 0)) {
      try {
        const input = {
          content: content.trim(),
          background: selectedBackground || undefined,
          images: images.length > 0 ? images : undefined,
          taggedUsers: taggedUsers?.map((user:any) => user.id),
          privacy: 'PUBLIC' // Default privacy setting
        };

        // Use the mutation if no custom onSubmit handler is provided
        if (!onPostSubmit) {
          const result = await createPost({
            variables: { input },
            update: (cache, { data }) => {
              // Handle cache update if needed
              if (data?.createPost) {
                // Optional: Update the cache with the new post
              }
            }
          });
          
          // Reset form after successful submission
          if (result.data) {
            setContent('');
            setImages([]);
            setTaggedUsers([]);
            setSelectedBackground(null);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
          }
        } else {
          // Use the custom onSubmit handler if provided
          //onPostSubmit(content, images, taggedUsers, selectedBackground || undefined);
          onPostSubmit(content,images,taggedUsers?.map((user:any) => user?.id),selectedBackground || undefined);
          setContent('');
          setImages([]);
          setTaggedUsers([]);
          setSelectedBackground(null);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }
      } catch (err) {
        console.error('Error creating post:', err);
        // Handle error (show notification, etc.)
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

    // Reset background if user uploads images (Facebook behavior)
    setSelectedBackground(null);

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

  const handleBackgroundSelect = (background: string | null) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
    
    // If user selects a background, clear any images (Facebook behavior)
    if (background) {
      setImages([]);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Determine text color based on background
  const getTextColor = () => {
    if (!selectedBackground) return '#050505';
    
    // For solid colors
    if (selectedBackground.startsWith('#')) {
      // Simple brightness calculation
      const hex = selectedBackground.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#050505' : '#ffffff';
    }
    
    // For gradients, assume they're dark
    return '#ffffff';
  };

  return (
    <div className="post-input-container">
      <div className="post-input-card">
        <div className="post-input-header">
          <div className="user-info">
            <img src={user.avatar || '/NoImage.webp'} alt={user.name} className="user-avatar" />
            <span className="user-name">{user.name}</span>
          </div>
          <button className="more-options-btn">
            <FiMoreHorizontal />
          </button>
        </div>
        
        <div 
          className={`input-container ${isFocused ? 'focused' : ''} ${selectedBackground ? 'has-background' : ''}`}
          style={{ 
            background: selectedBackground || undefined,
            border: selectedBackground ? 'none' : undefined
          }}
        >
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
            style={{ 
              color: getTextColor(),
              background: 'transparent'
            }}
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
        
        {showBackgrounds && (
          <div className="backgrounds-container">
            <h4>Select a background</h4>
            <div className="background-options">
              {backgroundOptions.map(bg => (
                <div
                  key={bg.id}
                  className={`background-option ${selectedBackground === bg.value ? 'selected' : ''}`}
                  style={{ background: bg.value || '#ffffff' }}
                  onClick={() => handleBackgroundSelect(bg.value)}
                  title={bg.label}
                >
                  {bg.value === null && <span>Default</span>}
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
              aria-label="Backgrounds"
              onClick={() => setShowBackgrounds(prev => !prev)}
            >
              <FaPaintBrush className="background-icon" />
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
            disabled={(!content.trim() && images.length === 0) || loading}
            className={`post-btn ${(content.trim() || images.length > 0) && !loading ? 'active' : ''}`}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            Error creating post: {error.message}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .post-input-container {
          width: 100%;
          max-width: 680px;
          margin-bottom:10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .post-input-card {
          background: #ffffff;
          border-radius: 0px;
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
          transition: all 0.2s;
          min-height: 120px;
          display: flex;
          align-items: flex-start;
        }
        
        .input-container.has-background {
          min-height: 200px;
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
          min-height: 40px;
          max-height: 150px;
          font-family: inherit;
          font-weight: 500;
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
        
        .backgrounds-container {
          border: 1px solid #e4e6eb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          background: white;
        }
        
        .backgrounds-container h4 {
          margin: 0 0 12px 0;
          color: #050505;
          font-size: 16px;
        }
        
        .background-options {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        
        .background-option {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
          transition: transform 0.2s, border-color 0.2s;
        }
        
        .background-option:hover {
          transform: scale(1.1);
        }
        
        .background-option.selected {
          border-color: #1877f2;
          transform: scale(1.1);
        }
        
        .background-option span {
          font-size: 10px;
          font-weight: bold;
          color: #000;
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
        
        .background-icon {
          color: #9b59b6;
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
        
        .error-message {
          color: #f3425f;
          margin-top: 12px;
          padding: 8px;
          background-color: #ffe6e6;
          border-radius: 4px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default PostInput;
