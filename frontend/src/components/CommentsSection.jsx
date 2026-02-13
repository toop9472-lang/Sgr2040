import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Send, Trash2, Reply, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const CommentsSection = ({ adId, user }) => {
  const { t, isRTL } = useLanguage();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (adId) {
      fetchComments();
    }
  }, [adId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/comments/ad/${adId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!user || user.isGuest) {
      toast.error(isRTL ? 'يجب تسجيل الدخول للتعليق' : 'Login to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_id: adId,
          content: newComment,
          parent_id: replyTo?.comment_id || null
        })
      });

      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
        toast.success(isRTL ? 'تم إضافة التعليق' : 'Comment added');
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!user || user.isGuest) {
      toast.error(isRTL ? 'يجب تسجيل الدخول' : 'Login required');
      return;
    }

    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/comments/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment_id: commentId })
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchComments();
        toast.success(isRTL ? 'تم حذف التعليق' : 'Comment deleted');
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const userId = user?.id || user?.user_id;
    const isOwner = userId === comment.user_id;
    const isLiked = comment.likes?.includes(userId);

    return (
      <div className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                <span className="text-[#60a5fa] text-sm font-bold">
                  {comment.user_name?.[0] || 'U'}
                </span>
              </div>
              <div>
                <span className="text-white text-sm font-medium">{comment.user_name}</span>
                <span className="text-gray-500 text-xs block">
                  {new Date(comment.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => handleDelete(comment.comment_id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          
          <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(comment.comment_id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              {comment.likes_count || 0}
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#60a5fa] transition-colors"
              >
                <Reply size={14} />
                {isRTL ? 'رد' : 'Reply'}
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies?.map((reply) => (
          <CommentItem key={reply.comment_id} comment={reply} isReply />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#111118]/80 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="text-[#60a5fa]" size={20} />
        <h3 className="text-white font-medium">
          {isRTL ? 'التعليقات' : 'Comments'} ({comments.length})
        </h3>
      </div>

      {/* Comment Input */}
      <div className="mb-4">
        {replyTo && (
          <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-2 mb-2 flex items-center justify-between">
            <span className="text-[#60a5fa] text-sm">
              {isRTL ? `الرد على ${replyTo.user_name}` : `Replying to ${replyTo.user_name}`}
            </span>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white">
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isRTL ? 'اكتب تعليقك...' : 'Write a comment...'}
            className="bg-white/5 border-white/10 text-white flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            disabled={!user || user.isGuest}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim() || !user || user.isGuest}
            className="bg-[#3b82f6]"
          >
            <Send size={18} />
          </Button>
        </div>
        {(!user || user.isGuest) && (
          <p className="text-gray-500 text-xs mt-1">
            {isRTL ? 'سجل الدخول للتعليق' : 'Login to comment'}
          </p>
        )}
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-400">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
          <p>{isRTL ? 'لا توجد تعليقات بعد' : 'No comments yet'}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem key={comment.comment_id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
