import 'reflect-metadata';
import Vue from 'vue';
import Vuetify from 'vuetify';

import 'vuetify/dist/vuetify.min.css';

import Confirm from '@App/views/pages/Confirm/index.vue';
import { ENV_FRONTEND, InitApp } from './apps/app';
import { SystemCache } from './pkg/storage/cache/system-cache';
import { DBLogger } from './apps/logger/logger';
import { migrate } from './model/migrate';

migrate();

Vue.use(Vuetify);

const opts = {};
const vuetifyInstance = new Vuetify(opts);

InitApp({
    Log: new DBLogger(),
    Cache: new SystemCache(),
    Environment: ENV_FRONTEND
});

new Vue({
    vuetify: vuetifyInstance,
    render: (h) => h(Confirm),
}).$mount('#app');
