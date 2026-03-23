import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [replyInputs, setReplyInputs] = useState({});
    const [activeReplyId, setActiveReplyId] = useState(null);

    // --- 무한 스크롤 상태 ---
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();

    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username');

    // 게시글 불러오기 (pageNum 인자 추가)
    const fetchPosts = useCallback(async (pageNum) => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            // 백엔드 Pageable 규격에 맞게 쿼리스트링 전달
            const response = await apiClient.get(`/api/posts/list?page=${pageNum}&size=10`);

            // Spring Page 객체는 실제 데이터를 'content' 필드에 담아 보냅니다.
            const newData = response.data.content || response.data;

            if (!newData || newData.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => pageNum === 0 ? newData : [...prev, ...newData]);
            }
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore]);

    // 초기 로딩
    useEffect(() => {
        fetchPosts(0);
    }, []);

    // 마지막 요소 감지용 Observer 설정
    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchPosts(nextPage);
                    return nextPage;
                });
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchPosts]);

    const handleBack = () => navigate('/main');

    const handleCreatePost = async () => {
        if (!newPostTitle || !newPostContent) return;
        try {
            await apiClient.post('/api/posts/create', {
                title: newPostTitle,
                content: newPostContent,
            });
            setNewPostTitle('');
            setNewPostContent('');
            // 작성 후 초기화하고 첫 페이지부터 다시 로드
            setPage(0);
            setHasMore(true);
            fetchPosts(0);
        } catch (error) {
            console.error('게시글 작성 실패:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/api/posts/${postId}`);
            alert("게시글이 삭제되었습니다.");
            setPage(0);
            setHasMore(true);
            fetchPosts(0);
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
        }
    };

    const handleAddComment = async (postId) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, { content: commentText });
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            // 댓글 작성 후 상태 업데이트를 위해 해당 데이터만 다시 가져오거나 전체 리프레시
            // 여기서는 단순함을 위해 첫 페이지 리프레시 처리
            setPage(0); setHasMore(true); fetchPosts(0);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    // ... (handleDeleteComment, handleAddReply 로직은 기존과 동일하므로 생략 가능하나 fetchPosts(0)로 갱신 필요)

    return (
        <div style={styles.container}>
            <div style={styles.navBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={handleBack} style={styles.backButton}>〈</button>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>📋 자유 게시판</div>
                </div>
            </div>

            <div style={styles.stickyHeader}>
                <div style={styles.createForm}>
                    <input type="text" placeholder="제목" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} style={styles.input} />
                    <textarea placeholder="내용을 입력하세요" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} style={styles.textarea} />
                    <button onClick={handleCreatePost} style={styles.button}>게시글 작성</button>
                </div>
            </div>

            <div style={styles.scrollArea}>
                <div style={styles.postList}>
                    {posts.map((post, index) => {
                        const isLastElement = posts.length === index + 1;
                        return (
                            <div
                                key={post.id}
                                ref={isLastElement ? lastPostElementRef : null}
                                style={styles.postCard}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={styles.postTitle}>{post.title}</h3>
                                    {post.authorName === currentUsername && (
                                        <button onClick={() => handleDeletePost(post.id)} style={styles.deleteBtn}>삭제</button>
                                    )}
                                </div>
                                <p style={styles.postContent}>{post.content}</p>
                                <div style={styles.postMeta}>
                                    작성자: {post.authorName} | {new Date(post.createdAt).toLocaleDateString()}
                                </div>

                                {/* 댓글 영역 (기존 로직 유지) */}
                                <div style={styles.commentSection}>
                                    <h4 style={{fontSize: '14px', marginBottom: '10px'}}>댓글 ({post.comments ? post.comments.length : 0})</h4>
                                    {post.comments && post.comments
                                        .filter(comment => !comment.parentId)
                                        .map(comment => (
                                            <div key={comment.id} style={styles.commentItem}>
                                                <div style={styles.commentMain}>
                                                    <div>
                                                        <span style={{fontWeight: 'bold', marginRight: '5px'}}>{comment.authorName}</span>
                                                        <span>{comment.content}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button style={styles.replyButton} onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}>
                                                            {activeReplyId === comment.id ? '취소' : '답글'}
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* 답글 리스트 및 입력창 로직 동일 */}
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
                        );
                    })}

                    {loading && <p style={styles.loadingText}>데이터를 가져오는 중...</p>}
                    {!hasMore && posts.length > 0 && <p style={styles.endMessage}>모든 게시글을 불러왔습니다.</p>}
                    {posts.length === 0 && !loading && <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>등록된 게시글이 없습니다.</p>}
                </div>
            </div>
        </div>
    );
};

const styles = {
    // ... 기존 스타일 그대로 유지 ...
    container: { height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', position: 'relative' },
    navBar: { height: '60px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#fff', flexShrink: 0 },
    backButton: { backgroundColor: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    stickyHeader: { padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee', zIndex: 10 },
    createForm: { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '12px' },
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' },
    textarea: { width: '100%', padding: '12px', height: '80px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', resize: 'none' },
    button: { width: '100%', padding: '12px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    postList: { display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' },
    postCard: { padding: '20px', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    postTitle: { margin: '0 0 10px 0', fontSize: '18px' },
    postContent: { whiteSpace: 'pre-wrap', color: '#444', fontSize: '15px', lineHeight: '1.5' },
    postMeta: { fontSize: '12px', color: '#999', marginTop: '12px' },
    commentSection: { marginTop: '15px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' },
    commentItem: { padding: '10px 0', borderBottom: '1px solid #fcfcfc' },
    commentMain: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'flex-start' },
    replyButton: { border: 'none', background: 'none', color: '#4285F4', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    commentInput: { width: '100%', padding: '12px', marginTop: '15px', boxSizing: 'border-box', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', fontSize: '14px' },
    deleteBtn: { padding: '4px 8px', backgroundColor: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' },

    // 추가된 스타일
    loadingText: { textAlign: 'center', color: '#4285F4', margin: '20px 0' },
    endMessage: { textAlign: 'center', color: '#999', fontSize: '13px', margin: '20px 0' }
};

export default BoardPage;