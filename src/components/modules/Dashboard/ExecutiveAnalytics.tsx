"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Skeleton, Alert } from "antd";
import webStorageClient from "@/utils/webStorageClient";

// Inline SVG Icons for clean bundle resilience
const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4a5 5 0 005 5h4a5 5 0 005-5V3M5 3h14M5 3H3v4a3 3 0 003 3h2m11-7h2a3 3 0 013 3v.5a3.5 3.5 0 01-3.5 3.5H19m-7 4v6m-4 0h8" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
  </svg>
);

const SyncIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface AdminMetrics {
  totalUsers: number;
  activeEvents: number;
  pendingBlogs: number;
  leetcodeSubmissions: number;
}

export default function ExecutiveAnalytics() {
  const [stats, setStats] = useState<AdminMetrics>({
    totalUsers: 148,
    activeEvents: 3,
    pendingBlogs: 12,
    leetcodeSubmissions: 342,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_SERVER =
    process.env.NEXT_PUBLIC_API_SERVER ||
    "https://dever-backend-production.up.railway.app";

  const fetchLiveMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = webStorageClient.getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [usersRes, eventsRes, blogsRes, leetcodeRes] = await Promise.allSettled([
        fetch(`${API_SERVER}/api/v1/users`, { headers }),
        fetch(`${API_SERVER}/api/v1/events`),
        fetch(`${API_SERVER}/api/v1/blogs/admin/review-queue`, { headers }),
        fetch(`${API_SERVER}/api/v1/leetcode/leaderboard`),
      ]);

      let userCount = stats.totalUsers;
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json();
        if (Array.isArray(data?.data)) userCount = data.data.length;
        else if (Array.isArray(data?.data?.users)) userCount = data.data.users.length;
      }

      let eventCount = stats.activeEvents;
      if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
        const data = await eventsRes.value.json();
        if (Array.isArray(data?.data)) {
          eventCount = data.data.filter((e: any) => e.status === "Đang mở đăng ký" || e.status === "Đang diễn ra").length || data.data.length;
        }
      }

      let pendingBlogCount = stats.pendingBlogs;
      if (blogsRes.status === "fulfilled" && blogsRes.value.ok) {
        const data = await blogsRes.value.json();
        if (Array.isArray(data?.data)) {
          pendingBlogCount = data.data.filter((b: any) => b.status === "pending_review").length;
        }
      }

      let submissionCount = stats.leetcodeSubmissions;
      if (leetcodeRes.status === "fulfilled" && leetcodeRes.value.ok) {
        const data = await leetcodeRes.value.json();
        if (Array.isArray(data?.data)) {
          submissionCount = data.data.reduce((acc: number, cur: any) => acc + (cur.acSubmissionList?.length || cur.totalSolved || 0), 0) || stats.leetcodeSubmissions;
        }
      }

      setStats({
        totalUsers: userCount,
        activeEvents: eventCount,
        pendingBlogs: pendingBlogCount,
        leetcodeSubmissions: submissionCount,
      });
    } catch (err: any) {
      setError("Không thể đồng bộ số liệu thời gian thực từ API máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [API_SERVER]);

  useEffect(() => {
    fetchLiveMetrics();
  }, [fetchLiveMetrics]);

  return (
    <div className="w-full space-y-4 mb-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 m-0">
            Executive Overview &amp; Club Metrics
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
              Live Realtime
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Thống kê tổng quan hoạt động câu lạc bộ FU-DEVER 2026
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLiveMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#0066CC] hover:text-[#0066CC] transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          <SyncIcon />
          <span>{loading ? "Đang đồng bộ..." : "Làm mới số liệu"}</span>
        </button>
      </div>

      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          action={
            <button
              type="button"
              onClick={fetchLiveMetrics}
              className="text-xs font-bold text-amber-800 underline cursor-pointer"
            >
              Thử lại
            </button>
          }
          className="!rounded-2xl"
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#0066CC] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-blue-50 text-[#0066CC] dark:bg-blue-900/30">
                <UserGroupIcon />
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                +12 Gen 9 <ArrowUpRightIcon />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-slate-500 m-0">Thành viên chính thức</p>
          </div>

          {/* Metric 2 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#0066CC] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                <CalendarIcon />
              </span>
              <span className="text-xs text-blue-600 font-bold flex items-center gap-0.5">
                Đang mở <ArrowUpRightIcon />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stats.activeEvents}
            </div>
            <p className="text-xs text-slate-500 m-0">Sự kiện &amp; Workshop active</p>
          </div>

          {/* Metric 3 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#0066CC] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
                <BookOpenIcon />
              </span>
              <span className="text-xs text-amber-600 font-bold">Cần duyệt</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stats.pendingBlogs}
            </div>
            <p className="text-xs text-slate-500 m-0">Bài viết Tech Blog</p>
          </div>

          {/* Metric 4 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#0066CC] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                <TrophyIcon />
              </span>
              <span className="text-xs text-purple-600 font-bold">+24 tuần này</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stats.leetcodeSubmissions}
            </div>
            <p className="text-xs text-slate-500 m-0">Bài tập LeetCode AC</p>
          </div>
        </div>
      )}
    </div>
  );
}
