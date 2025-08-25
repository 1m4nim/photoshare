import React, { useState } from "react";
import { ref, uploadBytes, getDownloadingURL } from "firebase/storage";
import { collection, addDoc, servertimestamp } from "firebase/firestore";
import { auth, db, storage } from "../firebase";

const UploadPost = () => {
    const [imageFile, setImageFile] = useState(null);
    const [caption, setCaption] = useState('');

    // ファイルが選択された時に状態を更新する
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    // 投稿ボタンが押されたら...
    const handleUpload = async () => {
        // ファイルが選択されていない場合は処理を中断
        if (!imageFile) return;

        // Firebase Storageに保存するための参照を作成
        const storageRef = ref(storage, `images/${imageFile.name}`);

        try {
            // 1. Storageに画像をアップロード
            const snapshot = await uploadBytes(storageRef, imageFile);
            // アップロードされた画像のダウンロードURLを取得
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Firestoreに投稿情報を保存
            await addDoc(collection(db, 'posts'), {
                userId: auth.currentUser.uid, // 現在ログインしているユーザーID
                imageUrl: downloadURL,
                caption: caption,
                createdAt: serverTimestamp(), // Firebaseのタイムスタンプ
            });

            console.log('投稿成功!');
            // フォームをリセット
            setCaption('');
            setImageFile(null);
        } catch (error) {
            console.error('アップロード失敗:', error.message);
        }
    };

    return (
        <div>
            <h2>新しい投稿</h2>
            <input type="file" onChange={handleFileChange} />
            <input
                type="text"
                placeholder="キャプションを入力"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            />
            <button onClick={handleUpload}>投稿する</button>
        </div>
    );
};

export default UploadPost;