import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [commentInputs, setCommentInputs] = useState({});

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();

    const navigate = useNavigate();

    const currentUsername = localStorage.getItem('username');

    // ✅ 게시글 가져오기
    const fetchPosts = useCallback(async (pageNum, isRefresh = false) => {
        if (loading && !isRefresh) return;
        setLoading(true);

        try {
            const response = await apiClient.get(`/api/posts/list?page=${pageNum}&size=10`);
            const newData = response.data.content || response.data;

            if (!newData || newData.length === 0) {
                if (pageNum === 0) setPosts([]);
                setHasMore(false);
            } else {
                setPosts(prev =>
                    (pageNum === 0 || isRefresh) ? newData : [...prev, ...newData]
                );
                setHasMore(newData.length === 10);
            }
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        fetchPosts(0, true);
    }, []);

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

    // ✅ 게시글 작성
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
            fetchPosts(0, true);

        } catch (error) {
            console.error('게시글 작성 실패:', error);

            if (error.response?.status === 401) {
                alert("로그인이 필요합니다.");
                navigate('/login');
            }
        }
    };

    // ✅ 게시글 삭제
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

    // ✅ 댓글 작성
    const handleAddComment = async (postId) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;

        try {
            await apiClient.post(`/api/posts/${postId}/comments`, {
                content: commentText
            });

            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            fetchPosts(0, true);

        } catch (error) {
            console.error('댓글 작성 실패:', error);

            if (error.response?.status === 401) {
                alert("로그인이 필요합니다.");
                navigate('/login');
            }
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
                                key={`${post.id}-${index}`}
                                ref={isLast ? lastPostElementRef : null}
                                style={styles.postCard}
                            >
                                <div style={styles.postHeader}>
                                    <div style={styles.authorBadge}>
                                        {post.authorName?.substring(0, 1)}
                                    </div>

                                    <div style={styles.postInfo}>
                                        <div style={styles.postAuthorName}>{post.authorName}</div>
                                        <div style={styles.postDate}>
                                            {post.createdAt
                                                ? new Date(post.createdAt).toLocaleDateString()
                                                : '방금 전'}
                                        </div>
                                    </div>

                                    {post.authorName === currentUsername && (
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            style={styles.deleteBtn}
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>

                                <h3 style={styles.postTitleText}>{post.title}</h3>
                                <p style={styles.postContentText}>{post.content}</p>

                                <div style={styles.commentContainer}>
                                    <div style={styles.commentHeader}>
                                        댓글 {post.comments?.length || 0}
                                    </div>

                                    {post.comments?.map(comment => (
                                        <div key={comment.id} style={styles.commentItem}>
                                            <span style={styles.commentAuthor}>{comment.authorName}</span>
                                            <span>{comment.content}</span>
                                        </div>
                                    ))}

                                    <input
                                        type="text"
                                        placeholder="댓글 입력..."
                                        value={commentInputs[post.id] || ''}
                                        onChange={(e) =>
                                            setCommentInputs({
                                                ...commentInputs,
                                                [post.id]: e.target.value
                                            })
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleAddComment(post.id)
                                        }
                                        style={styles.commentInput}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {loading && <div>로딩중...</div>}
                    {!hasMore && <div>마지막입니다</div>}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column' },
    navBar: { height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
    backButton: { background: 'none', border: 'none', fontSize: '20px' },
    navTitle: { fontSize: '18px', fontWeight: 'bold' },
    headerSection: { padding: '20px' },
    createCard: { maxWidth: '700px', margin: '0 auto' },
    inputTitle: { width: '100%', marginBottom: '10px' },
    inputTextarea: { width: '100%', height: '80px' },
    createCardFooter: { display: 'flex', justifyContent: 'space-between' },
    submitBtn: { padding: '10px' },
    scrollArea: { flex: 1, overflowY: 'auto' },
    postList: { maxWidth: '700px', margin: '0 auto' },
    postCard: { padding: '20px', border: '1px solid #ddd', marginBottom: '20px' },
    postHeader: { display: 'flex', alignItems: 'center' },
    authorBadge: { width: '40px', height: '40px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    postInfo: { marginLeft: '10px' },
    deleteBtn: { marginLeft: 'auto', color: 'red' },
    commentContainer: { marginTop: '15px' },
    commentItem: { fontSize: '14px' },
    commentInput: { width: '100%', marginTop: '10px' }
};

export default BoardPage;