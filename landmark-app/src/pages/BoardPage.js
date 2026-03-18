import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [replyInputs, setReplyInputs] = useState({});
    const [activeReplyId, setActiveReplyId] = useState(null);

    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await apiClient.get('/api/posts/list');
            setPosts(response.data);
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostTitle || !newPostContent) return;
        try {
            await apiClient.post('/api/posts/create', {
                title: newPostTitle,
                content: newPostContent,
            });
            setNewPostTitle('');
            setNewPostContent('');
            fetchPosts();
        } catch (error) {
            console.error('게시글 작성 실패:', error);
        }
    };

    // ✅ 게시글 삭제 (PostController: DELETE /api/posts/{id})
    const handleDeletePost = async (postId) => {
        if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/api/posts/${postId}`);
            alert("게시글이 삭제되었습니다.");
            fetchPosts();
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
            alert("삭제 권한이 없거나 오류가 발생했습니다.");
        }
    };

    const handleAddComment = async (postId) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, { content: commentText });
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            fetchPosts();
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    // ✅ 댓글 삭제 (CommentController: DELETE /api/posts/{postId}/comments/{commentId})
    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            // 컨트롤러의 @RequestMapping이 /api/posts/{postId}/comments 이므로 주소를 맞춰줍니다.
            await apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
            alert("댓글이 삭제되었습니다.");
            fetchPosts();
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert("본인 댓글만 삭제할 수 있습니다.");
        }
    };

    const handleAddReply = async (postId, parentId) => {
        const replyText = replyInputs[parentId];
        if (!replyText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, {
                content: replyText,
                parentId: parentId
            });
            setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
            setActiveReplyId(null);
            fetchPosts();
        } catch (error) {
            console.error('답글 작성 실패:', error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.stickyHeader}>
                <div style={styles.header}>
                    <h2>📋 자유 게시판</h2>
                    <Link to="/main" style={styles.backLink}>← 메인으로</Link>
                </div>
                <div style={styles.createForm}>
                    <input type="text" placeholder="제목" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} style={styles.input} />
                    <textarea placeholder="내용을 입력하세요" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} style={styles.textarea} />
                    <button onClick={handleCreatePost} style={styles.button}>게시글 작성</button>
                </div>
            </div>

            <div style={styles.scrollArea}>
                <div style={styles.postList}>
                    {posts.map(post => (
                        <div key={post.id} style={styles.postCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={styles.postTitle}>{post.title}</h3>
                                {post.authorName === currentUsername && (
                                    <button onClick={() => handleDeletePost(post.id)} style={styles.deleteBtn}>삭제</button>
                                )}
                            </div>
                            <p style={styles.postContent}>{post.content}</p>
                            <div style={styles.postMeta}>
                                작성자: {post.authorName} | {new Date(post.createdAt).toLocaleDateString()}
                            </div>

                            <div style={styles.commentSection}>
                                <h4>댓글 ({post.comments ? post.comments.length : 0})</h4>

                                {post.comments && post.comments
                                    .filter(comment => !comment.parentId)
                                    .map(comment => (
                                        <div key={comment.id} style={styles.commentItem}>
                                            <div style={styles.commentMain}>
                                                <div>
                                                    <strong>{comment.authorName}:</strong> {comment.content}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button style={styles.replyButton} onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}>
                                                        {activeReplyId === comment.id ? '취소' : '답글'}
                                                    </button>
                                                    {comment.authorName === currentUsername && (
                                                        <button style={styles.delTextBtn} onClick={() => handleDeleteComment(post.id, comment.id)}>삭제</button>
                                                    )}
                                                </div>
                                            </div>

                                            {activeReplyId === comment.id && (
                                                <div style={styles.replyInputWrapper}>
                                                    <input
                                                        style={styles.replyInput}
                                                        placeholder="답글 입력..."
                                                        value={replyInputs[comment.id] || ''}
                                                        onChange={(e) => setReplyInputs({...replyInputs, [comment.id]: e.target.value})}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post.id, comment.id)}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}

                                            {comment.children && comment.children.map(child => (
                                                <div key={child.id} style={styles.replyItem}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <span style={styles.replyArrow}>└</span>
                                                            <strong>{child.authorName}:</strong> {child.content}
                                                        </div>
                                                        {child.authorName === currentUsername && (
                                                            <button style={styles.delTextBtn} onClick={() => handleDeleteComment(post.id, child.id)}>삭제</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                }

                                <input
                                    type="text"
                                    placeholder="댓글 입력 후 엔터..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    style={styles.commentInput}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff' },
    stickyHeader: { padding: '20px', backgroundColor: '#fff', borderBottom: '2px solid #eee', zIndex: 10 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    createForm: { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
    backLink: { textDecoration: 'none', color: '#4285F4', fontWeight: 'bold' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', height: '60px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    button: { width: '100%', padding: '10px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    postList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    postCard: { padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    postTitle: { margin: '0 0 10px 0' },
    postContent: { whiteSpace: 'pre-wrap', color: '#555' },
    postMeta: { fontSize: '12px', color: '#999', marginTop: '10px' },
    commentSection: { marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' },
    commentItem: { padding: '8px 0', borderBottom: '1px solid #f9f9f9' },
    commentMain: { display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
    replyButton: { border: 'none', background: 'none', color: '#4285F4', cursor: 'pointer', fontSize: '12px' },
    replyInputWrapper: { marginLeft: '20px', marginTop: '5px' },
    replyInput: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' },
    replyItem: { marginLeft: '20px', fontSize: '13px', color: '#666', marginTop: '5px' },
    replyArrow: { marginRight: '5px', color: '#4285F4' },
    commentInput: { width: '100%', padding: '8px', marginTop: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' },
    // ✅ 추가된 버튼 스타일
    deleteBtn: { padding: '5px 10px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    delTextBtn: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '12px' }
};

export default BoardPage;