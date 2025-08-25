import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Feed = () => {
    // 投稿データを格納する状態
    const [posts, setPosts] = useState([]);

    // コンポーネントがマウントされた時に一度だけ実行
    useEffect(() => {
        // Firestoreの'posts'コレクションを参照
        // createdAt（作成日時）の降順で並べ替え
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

        // リアルタイムリスナーを設定
        // データが変更されるたびにコールバック関数が実行される
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            // 取得したドキュメントを配列に変換
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id, // ドキュメントIDをキーとして使うため取得
                ...doc.data(), // ドキュメントのデータを展開
            }));
            // 状態を更新して再レンダリングをトリガー
            setPosts(fetchedPosts);
        });

        // クリーンアップ関数: コンポーネントがアンマウントされた時にリスナーを解除
        return () => unsubscribe();
    }, []); // 依存配列が空なので、一度だけ実行される

    return (
        <div>
            <h2>投稿フィード</h2>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                        {/* 投稿された画像を表示 */}
                        <img src={post.imageUrl} alt={post.caption} style={{ width: '100%', maxWidth: '400px' }} />
                        {/* キャプションを表示 */}
                        <p>{post.caption}</p>
                    </div>
                ))
            ) : (
                <p>まだ投稿がありません。</p>
            )}
        </div>
    );
};

export default Feed;