import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const Feed = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(fetchedPosts);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div>
            <h2>投稿フィード</h2>
            {posts.length > 0 ? (
                posts.map((post) => {
                    // FirestoreのタイムスタンプをJavaScriptのDateオブジェクトに変換
                    const date = post.createdAt?.toDate();
                    // 日付と時間をフォーマット
                    const formattedDate = date ? format(date, 'yyyy年MM月dd日 HH:mm') : '日付不明';

                    return (
                        <div key={post.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                            {/* 投稿者の名前を表示 */}
                            <h4>{post.displayName || '匿名ユーザー'}</h4>
                            <img src={post.imageUrl} alt={post.caption} style={{ width: '100%', maxWidth: '400px' }} />
                            <p>{post.caption}</p>
                            {/* 投稿日時を表示 */}
                            <p style={{ fontSize: '0.8em', color: '#666' }}>投稿日時: {formattedDate}</p>
                        </div>
                    );
                })
            ) : (
                <p>まだ投稿がありません。</p>
            )}
        </div>
    );
};

export default Feed;