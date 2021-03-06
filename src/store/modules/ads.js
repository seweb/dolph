import {
  mixinDialogMutations,
  mixinDialogActions,
  mixinDialogGetters
} from '../../mixins/vuex_dialogs';
import {
  mixinSetLoading
} from '../../mixins/vuex_loading';

// import i18n from '../../i18n';

export default {
  namespaced: true,
  state: {
    ads: {
      all: [],
      selected: localStorage.getItem('adsmanager-ads-selected') ?
        JSON.parse(localStorage.getItem('adsmanager-ads-selected')) : [],
      filtered: [],
    },
    dialogs: {
      pause: false,
      start: false,
      duplicate: false,
    },
    loading: {
      mainTable: false,
    },
    stat: [],
    filters: {
      name: '',
      statuses: typeof localStorage.getItem('accounts-filters-statuses') === 'undefined' ? [] : JSON.parse(localStorage.getItem('accounts-filters-statuses')),
    },
  },
  getters: {
    ...mixinDialogGetters,

    ads: state => state.ads,
    selected: state => state.ads.selected,
    loading: state => state.loading,
    stat: state => state.stat,
    FILTERS: state => state.filters,
  },
  mutations: {
    ...mixinDialogMutations,
    ...mixinSetLoading,

    FILTER: state => {
      state.ads.filtered = state.ads.all;
    },

    SET_STAT: (state, stat) => {
      state.stat = stat;
    },

    SET_SELECTED: (state, data) => {
      state.ads.selected = data;
      localStorage.setItem('adsmanager-ads-selected', JSON.stringify(data));
    },

    SET_ALL: (state, payload) => {
      state.ads.all = payload;
    },

    SET_FILTERED: (state, payload) => {
      state.ads.filtered = payload;
    },

    SET_FILTERS_NAME: (state, payload) => {
      state.filters.name = payload;
    },

    FILTER_ADS (state) {
      let ads = state.ads.all;
      const filters = state.filters;

      if (filters.name) {
        if (filters.name.length > 0) {
          ads = ads.filter(ad => {
            return (
              ad.name.toString().toLowerCase().search(filters.name.toLowerCase()) !== -1
            );
          });
        }
      }

      if (filters.statuses && filters.statuses.length > 0) {
        ads = ads.filter(function(ad) {
          return filters.statuses.indexOf(ad.status) > -1;
        });
      }

      if (this.state.adsmanager.filters.tags && this.state.adsmanager.filters.tags.length > 0) {
        ads = ads.filter(ad => {
          return this.state.adsmanager.filters.tags.some(tag => {
            if (!Array.isArray(ad.tags)) return false;
            return ads.tags.indexOf(tag.toString()) > -1;
          });
        });
      }
      
      state.ads.filtered = ads;
    },
  },
  actions: {
    ...mixinDialogActions,

    async loadAds({commit, dispatch, rootState}) {
      const data = {
        users_ids: rootState.users.users.selected.length > 0 ?
          rootState.users.users.selected.map(user => user.id) :
          rootState.users.users.all.length === 0 ?
            -1 : rootState.users.users.filtered.map(user => user.id),
        accounts_ids: rootState.accounts.accounts.selected.length > 0 ?
          rootState.accounts.accounts.selected.map(account => account.id) :
          rootState.accounts.accounts.all.length === 0 ?
            -1 : rootState.accounts.accounts.filtered.map(account => account.id),
        cabs_ids: rootState.cabs.cabs.selected.length > 0 ?
          rootState.cabs.cabs.selected.map(cab => cab.id) :
          rootState.cabs.cabs.all.length === 0 ?
            -1 : rootState.cabs.cabs.filtered.map(cab => cab.id),
        campaigns_ids: rootState.campaigns.campaigns.selected.length > 0 ?
          rootState.campaigns.campaigns.selected.map(campaign => campaign.id) : 
          rootState.campaigns.campaigns.all.length === 0 ?
            -1: rootState.campaigns.campaigns.filtered.map(campaign => campaign.id),
        adsets_ids: rootState.adsets.adsets.selected.length > 0 ?
          rootState.adsets.adsets.selected.map(adset => adset.id) :
          rootState.adsets.adsets.all.length === 0 ?
            -1: rootState.adsets.adsets.filtered.map(adset => adset.id)
      };

      console.log('===========================');
      console.log('LOAD ADS');
      console.log(JSON.stringify(data));

      const response = await this._vm.api.post('/ads', data);

      if (response.data.success) {
        commit('SET_ALL', response.data.data);
        commit('FILTER');
        dispatch('loadStat');
      }
      console.log('load ads response');
      console.log(response.data);
      console.log('===========================');
      commit('FILTER_ADS', rootState.adsmanager.filters);
    },

    async loadStat({
      dispatch,
      commit,
      rootState
    }) {
      commit('SET_LOADING', {
        param: 'mainTable',
        value: true,
      });

      if (!rootState.ads.ads.filtered) {
        return;
      }

      const data = {
        ids: rootState.ads.ads.filtered.map(ad => ad.id),
        dates: rootState.adsmanager.filters.dates,
      };
      console.log(JSON.stringify(data));
      const response = await this._vm.api.post('/stat/by_ad', data).catch((e) => {
        dispatch('main/apiError', e, {
          root: true
        });
      });

      commit('SET_LOADING', {
        param: 'mainTable',
        value: false,
      });

      //commit('SET_STAT', response.data.data);
      console.log(response.data.data);
      
    },

    async saveSelected(context, data) {
      context.commit('SET_SELECTED', data);
    },

    async clearSelected(context) {
      context.commit('SET_SELECTED', []);
    },

    async clear(context) {
      context.commit('SET_ALL', []);
      context.commit('SET_FILTERED', []);
      context.commit('SET_SELECTED', []);
    },

    async setFiltersName(context, payload) {
      context.commit('SET_FILTERS_NAME', payload);
    },
  }
};