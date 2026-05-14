<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { KeyRound, Users } from 'lucide-vue-next'
import RolePermissionsView from './RolePermissionsView.vue'
import UserPermissionsView from './UserPermissionsView.vue'

const route = useRoute()

const activeTab = ref(route.path.includes('users') ? 'users' : 'roles')
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Permisos</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Asignar permisos a roles y usuarios</p>
      </div>
    </div>

    <div class="mb-6">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 inline-flex">
        <button @click="activeTab = 'roles'" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="activeTab === 'roles' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
          <KeyRound class="w-4 h-4" /> <span>Roles & Permisos</span>
        </button>
        <button @click="activeTab = 'users'" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="activeTab === 'users' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
          <Users class="w-4 h-4" /> <span>Usuarios & Permisos</span>
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'roles'">
      <RolePermissionsView />
    </div>

    <div v-show="activeTab === 'users'">
      <UserPermissionsView />
    </div>
  </div>
</template>
