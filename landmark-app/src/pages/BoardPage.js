import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [commentInputs, setCommentInputs] = useState({});

    // --- 무한 스크롤 상태 ---
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();

    const navigate = useNavigate();
    // ✅ 'username' 키값 확인
    const currentUsername = localStorage.getItem('username');

    // 1️⃣ 게시글 가져오기 함수 (isRefresh 인자 추가)
    const fetchPosts = useCallback(async (pageNum, isRefresh = false) => {
        if (loading && !isRefresh) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/posts/list?page=${pageNum}&size=10`);
            // 백엔드 Page 객체 구조에 맞춰 content 추출
            const newData = response.data.content || response.data;

            if (!newData || newData.length === 0) {
                if (pageNum === 0) setPosts([]);
                setHasMore(false);
            } else {
                setPosts(prev => (pageNum === 0 || isRefresh) ? newData : [...prev, ...newData]);
                setHasMore(newData.length === 10);
            }
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
            // 401 에러는 api.js 인터셉터에서 처리하지만, 여기서도 안전하게 예외처리 가능
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // 초기 로드
    useEffect(() => {
        fetchPosts(0, true);
    }, []);

    // 무한 스크롤 감지
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

    // 2️⃣ 게시글 등록
    const handleCreatePost = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }
        try {
            await apiClient.post('/api/posts/create', {
                title: newPostTitle,
                content: newPostContent
            });
            setNewPostTitle('');
            setNewPostContent('');
            setPage(0);
            setHasMore(true);
            // ✅ 등록 후 즉시 첫 페이지 강제 새로고침
            fetchPosts(0, true);
        } catch (error) {
            console.error('게시글 작성 실패:', error);
        }
    };

    // 3️⃣ 게시글 삭제
    const handleDeletePost = async (postId) => {
        if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/api/posts/${postId}`);
            setPage(0);
            setHasMore(true);
            fetchPosts(0, true);
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    };

    // 4️⃣ 댓글 등록
    const handleAddComment = async (postId) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, {
                content: commentText
            });
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            // ✅ 댓글 등록 후 목록 최신화
            fetchPosts(0, true);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.navBar}>
                <button onClick={() => navigate('/main')} style={styles.backButton}>〈</button>
                <div style={styles.navTitle}>Community</div>
                <div style={{ width: '24px' }}></div>
            </div>

            <div style={styles.headerSection}>
                <div style={styles.createCard}>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        style={styles.inputTitle}
                    />
                    <textarea
                        placeholder="나누고 싶은 이야기가 있나요?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        style={styles.inputTextarea}
                    />
                    <div style={styles.createCardFooter}>
                        <span style={styles.tipText}>매너 있는 게시판 문화를 만들어주세요.</span>
                        <button onClick={handleCreatePost} style={styles.submitBtn}>등록하기</button>
                    </div>
                </div>
            </div>

            <div style={styles.scrollArea}>
                <div style={styles.postList}>
                    {posts.map((post, index) => {
                        const isLast = posts.length === index + 1;
                        return (
                            <div
                                key={`${post.id}-${index}`} // 고유 키 보강
                                ref={isLast ? lastPostElementRef : null}
                                style={styles.postCard}
                                className="post-card-ani"
                            >
                                <div style={styles.postHeader}>
                                    <div style={styles.authorBadge}>{post.authorName?.substring(0,1)}</div>
                                    <div style={styles.postInfo}>
                                        <div style={styles.postAuthorName}>{post.authorName}</div>
                                        <div style={styles.postDate}>
                                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전'}
                                        </div>
                                    </div>
                                    {post.authorName === currentUsername && (
                                        <button onClick={() => handleDeletePost(post.id)} style={styles.deleteBtn}>삭제</button>
                                    )}
                                </div>

                                <h3 style={styles.postTitleText}>{post.title}</h3>
                                <p style={styles.postContentText}>{post.content}</p>

                                <div style={styles.commentContainer}>
                                    <div style={styles.commentHeader}>
                                        <span>댓글 {post.comments?.length || 0}</span>
                                    </div>

                                    <div style={styles.commentList}>
                                        {post.comments?.map(comment => (
                                            <div key={comment.id} style={styles.commentItem}>
                                                <span style={styles.commentAuthor}>{comment.authorName}</span>
                                                <span style={styles.commentContent}>{comment.content}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={styles.commentInputWrapper}>
                                        <input
                                            type="text"
                                            placeholder="댓글을 남겨보세요..."
                                            value={commentInputs[post.id] || ''}
                                            onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            style={styles.commentInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {loading && <div style={styles.loadingPulse}>포스트를 불러오는 중...</div>}
                    {!hasMore && posts.length > 0 && <div style={styles.endMessage}>마지막 페이지입니다.</div>}
                </div>
            </div>

            <style>{`
                .post-card-ani { animation: slideUp 0.5s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                input:focus, textarea:focus { outline: none; border-color: #1a1a1a !important; }
            `}</style>
        </div>
    );
};

// 스타일 객체 (기존 유지)
const styles = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' },
    navBar: { height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 },
    backButton: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#1a1a1a' },
    navTitle: { fontSize: '18px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.5px' },
    headerSection: { padding: '20px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' },
    createCard: { maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff' },
    inputTitle: { width: '100%', padding: '10px 0', fontSize: '18px', fontWeight: '700', border: 'none', borderBottom: '1px solid #eee', marginBottom: '12px' },
    inputTextarea: { width: '100%', height: '80px', padding: '10px 0', fontSize: '15px', border: 'none', resize: 'none', color: '#444' },
    createCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
    tipText: { fontSize: '12px', color: '#aaa' },
    submitBtn: { backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' },
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
    postList: { maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' },
    postCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f1f1' },
    postHeader: { display: 'flex', alignItems: 'center', marginBottom: '18px' },
    authorBadge: { width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555' },
    postInfo: { flex: 1, marginLeft: '12px' },
    postAuthorName: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
    postDate: { fontSize: '12px', color: '#bbb', marginTop: '2px' },
    deleteBtn: { background: 'none', border: 'none', color: '#ff4d4f', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
    postTitleText: { fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '12px', letterSpacing: '-0.5px' },
    postContentText: { fontSize: '16px', lineHeight: '1.6', color: '#444', marginBottom: '20px', whiteSpace: 'pre-wrap' },
    commentContainer: { backgroundColor: '#f9f9f9', borderRadius: '14px', padding: '15px' },
    commentHeader: { fontSize: '13px', fontWeight: '700', color: '#666', marginBottom: '10px' },
    commentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    commentItem: { fontSize: '14px', display: 'flex', gap: '8px' },
    commentAuthor: { fontWeight: '700', color: '#333', minWidth: 'max-content' },
    commentContent: { color: '#555' },
    commentInputWrapper: { marginTop: '15px' },
    commentInput: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', boxSizing: 'border-box' },
    loadingPulse: { textAlign: 'center', padding: '20px', color: '#1a1a1a', fontWeight: '600', opacity: 0.6 },
    endMessage: { textAlign: 'center', padding: '20px', color: '#bbb', fontSize: '14px' }
};

export default BoardPage;