import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const Feed = () => {
  // 投稿データを格納する状態
  const [posts, setPosts] = useState([]);

  // コンポーネントがマウントされた時に一度だけ実行
  useEffect(() => {
    // Firestoreの'posts'コレクションを参照
    // createdAt（作成日時）の降順で並べ替え
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    // リアルタイムリスナーを設定
    // データが変更されるたびにコールバック関数が実行される
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      // 取得したドキュメントを配列に変換
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id, // ドキュメントIDをキーとして使うため取得
        ...doc.data(), // ドキュメントのデータを展開
      }));
      // 状態を更新して再レンダリングをトリガー
      setPosts(fetchedPosts);
    });

    // クリーンアップ関数: コンポーネントがアンマウントされた時にリスナーを解除
    //onSnapshotは、Firestoreと「つながりっぱなし」の状態を作る命令
    //アプリのページを閉じたり、別のページに移動したりしても、この「つながり」はそのまま残ってしまう
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2>投稿フィード</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {" "}
        {/* Flexboxコンテナ */}
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                flex: "1 1 300px",
              }}
            >
              {" "}
              <img
                src={post.imageUrl}
                alt={post.caption}
                style={{ width: "100%" }}
              />
              {/* キャプション */}
              <p>{post.caption}</p>
            </div>
          ))
        ) : (
          <p>まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
};

export default Feed;
