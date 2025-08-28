import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState("");
    // ユーザー名のための新しい状態
    const [displayName, setDisplayName] = useState("");

    //新規登録ボタンが押されたら...
    const handleRegister = async () => {
        try {
            // メアドとパスワードでユーザー作成
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // ユーザー登録成功後、displayNameをプロフィールに設定
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
            console.log("ユーザー登録成功：", userCredential.user);
        } catch (error) {
            console.error("ユーザー登録失敗：", error.message);
        }
    };

    //ログインボタンを押したら
    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("ログイン成功：", userCredential.user);
        } catch (error) {
            console.error("ログイン失敗：", error.message);
        }
    };

    return (
        <div>
            <h2>ログイン/新規登録</h2>
            <input
                type="text"
                placeholder="表示名"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>ログイン</button>
            <button onClick={handleRegister}>新規登録</button>
        </div>
    );
};

export default Login;