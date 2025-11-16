import React, { useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { createSlice, configureStore } from "@reduxjs/toolkit";
import { FiEdit, FiTrash2 } from "react-icons/fi";

import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";

const todosSlice = createSlice({
    name: "todos",
    initialState: { items: [] },
    reducers: {
        addTodo: (state, action) => {
            state.items.unshift(action.payload);
        },
        toggleTodo: (state, action) => {
            const t = state.items.find((i) => i.id === action.payload);
            if (t) t.completed = !t.completed;
        },
        editTodo: (state, action) => {
            const { id, text, category } = action.payload;
            const t = state.items.find((i) => i.id === id);
            if (t) {
                t.text = text;
                t.category = category;
            }
        },
        deleteTodo: (state, action) => {
            state.items = state.items.filter((i) => i.id !== action.payload);
        },
        clearAll: (state) => {
            state.items = [];
        },
    },
});

const rootReducer = (state = {}, action) => ({
    todos: todosSlice.reducer(state.todos, action),
});

const persistConfig = { key: "root", storage };
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (gDM) =>
        gDM({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

const persistor = persistStore(store);

const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const categories = ["All", "Work", "Personal", "Shopping", "Other"];

function AppInner() {
    const dispatch = useDispatch();
    const todos = useSelector((s) => s.todos.items);

    const [text, setText] = useState("");
    const [category, setCategory] = useState("Personal");
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    const completedCount = todos.filter((t) => t.completed).length;
    const pendingCount = todos.length - completedCount;

    const visible = todos.filter((t) => {
        if (filterCategory !== "All" && t.category !== filterCategory) return false;
        if (!search.trim()) return true;
        return t.text.toLowerCase().includes(search.trim().toLowerCase());
    });

    const addOrSaveTodo = (e) => {
        e.preventDefault();
        if (!text.trim()) return alert("Please enter a todo");

        if (editingId) {
            dispatch(
                todosSlice.actions.editTodo({
                    id: editingId,
                    text: text.trim(),
                    category,
                })
            );
            setEditingId(null);
        } else {
            dispatch(
                todosSlice.actions.addTodo({
                    id: uid(),
                    text: text.trim(),
                    completed: false,
                    category,
                    createdAt: Date.now(),
                })
            );
        }
        setText("");
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setText(t.text);
        setCategory(t.category);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen flex justify-center items-start p-4 bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg">

                <h1 className="text-2xl font-bold mb-6 text-slate-700 text-center">
                    Todo Manager
                </h1>

                {/* ADD / EDIT FORM */}
                <form
                    onSubmit={addOrSaveTodo}
                    className="flex flex-col md:flex-row gap-3 mb-6"
                >
                    <input
                        className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none flex-1"
                        placeholder="Add a todo..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                        <option>Personal</option>
                        <option>Work</option>
                        <option>Shopping</option>
                        <option>Other</option>
                    </select>

                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow transition"
                    >
                        {editingId ? "Save" : "Add"}
                    </button>
                </form>

                {editingId && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setText("");
                        }}
                        className="mb-5 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-300 transition"
                    >
                        Cancel Editing
                    </button>
                )}

                {/* SEARCH & FILTER */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">

                    <div className="font-semibold text-sm flex flex-col bg-slate-100 px-4 py-2 rounded-xl">
                        <span className="text-green-700">Completed: {completedCount}</span>
                        <span className="text-red-600">Pending: {pendingCount}</span>
                    </div>

                    <input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                        {categories.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* TODO LIST */}
                <ul className="space-y-4">
                    {visible.length === 0 && (
                        <li className="text-gray-500 p-3 text-sm text-center">
                            No todos found
                        </li>
                    )}

                    {visible.map((t) => (
                        <li
                            key={t.id}
                            className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-gray-200"
                        >
                            <div className="flex gap-3 items-start">
                                <input
                                    type="checkbox"
                                    checked={t.completed}
                                    onChange={() => dispatch(todosSlice.actions.toggleTodo(t.id))}
                                    className="mt-1"
                                />

                                <div>
                                    <div
                                        className={`text-sm font-medium ${t.completed ? "line-through text-gray-400" : ""
                                            }`}
                                    >
                                        {t.text}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {t.category} · {new Date(t.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => startEdit(t)}
                                    className="text-blue-600 hover:text-blue-700 text-xl hover:scale-110 transition"
                                >
                                    <FiEdit />
                                </button>

                                <button
                                    onClick={() =>
                                        window.confirm("Delete this todo?") &&
                                        dispatch(todosSlice.actions.deleteTodo(t.id))
                                    }
                                    className="text-red-600 hover:text-red-700 text-xl hover:scale-110 transition"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                        </li>
                    ))}
                </ul>

                {/* FOOTER */}
                <div className="flex justify-between items-center mt-6">
                    <small className="text-gray-600 text-sm">
                        {todos.length} total • Saved in Local Storage
                    </small>
                    <button
                        onClick={() =>
                            window.confirm("Clear all?") &&
                            dispatch(todosSlice.actions.clearAll())
                        }
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );

}

export default function App() {
    return (
        <Provider store={store}>
            <PersistGate persistor={persistor} loading={null}>
                <AppInner />
            </PersistGate>
        </Provider>
    );
}
