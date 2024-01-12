/**
 * @name AutoPingReply
 * @description Replies with ping or not
 * @version 0.0.1
 * @author PWall
 * @updateUrl https://raw.githubusercontent.com/pwall2222/ScriptsJS/main/BDPlugins/AutoPingReply.plugin.js
 */

module.exports = class AutoPingReply {
	constructor(meta) {
		this.meta = meta;
		this.api = new BdApi(meta.name);

		const { Filters } = this.api.Webpack;
		this.replyBar = this.getModuleAndKey(
			Filters.byStrings('type:"CREATE_PENDING_REPLY"')
		);
		this.store = this.api.Webpack.getStore("GuildMemberStore");
		this.settings = BdApi.Data.load(meta.name, "settings") ?? {
			defaultPing: false,
			guildBlackList: [],
			userBlakcList: [],
			userNeverPing: [],
			userAlwaysPing: [],
			namePing: [],
			namePingDisable: [],
			guildSettings: {
				"": {
					rolePing: [],
					rolePingDisable: [],
				},
			},
		};
		BdApi.Data.save(meta.name, "settings", this.settings);
	}

	getModuleAndKey(filter) {
		const { getModule } = this.api.Webpack;
		let module;
		const value = getModule((e, m) => (filter(e) ? (module = m) : false), {
			searchExports: true,
		});
		if (!module) return;
		return [
			module.exports,
			Object.keys(module.exports).find(
				(k) => module.exports[k] === value
			),
		];
	}

	start() {
		if (!this.replyBar) {
			console.error(
				`${this.meta.name}: Unable to start because the reply bar module could not be found.`
			);
			return;
		}

		const { Patcher } = this.api;
		Patcher.before(...this.replyBar, (_thisArg, [props]) => {
			if (!props.showMentionToggle) {
				return;
			}
			const { username, id } = props.message.author;
			const { guild_id: guild } = props.channel;
			if (this.settings.userBlakcList.includes(id)) {
				return;
			}
			if (this.settings.guildBlackList.includes(id)) {
				return;
			}

			const { roles, nick } = this.store.getMember(guild, id);
			const name = nick ?? username;
			const mention = this.shouldMention({ roles, guild, name, id });
			props.shouldMention = mention;
		});
	}

	/**
	 *
	 * @param {string[]} arr
	 * @param {string} str
	 * @returns {bool}
	 */
	some_includes(arr, str) {
		return arr.some((v) => str.includes(v));
	}

	/**
	 *
	 * @param {Array} arr1
	 * @param {Array} arr2
	 * @returns {bool}
	 */
	arr_overlap(arr1, arr2) {
		return arr1.some((v) => arr2.includes(v));
	}

	/**
	 * @param {Object} user
	 * @param {string} user.name
	 * @param {string[]} user.roles
	 * @param {string} user.id
	 * @param {string} user.guild
	 * @returns {boolean}
	 */
	shouldMention({ roles, guild, name, id }) {
		if (this.settings.userNeverPing.includes(id)) {
			return false;
		}
		if (this.settings.userAlwaysPing.includes(id)) {
			return true;
		}
		if (this.some_includes(this.settings.namePingDisable, name)) {
			return false;
		}
		if (this.some_includes(this.settings.namePing, name)) {
			return true;
		}
		const guildSettings = this.settings.guildSettings[guild];
		if (!guildSettings) {
			return this.settings.defaultPing;
		}
		if (this.arr_overlap(roles, guildSettings.rolePingDisable)) {
			return false;
		}
		if (this.arr_overlap(roles, guildSettings.rolePing)) {
			return true;
		}
		return this.settings.defaultPing;
	}

	stop() {
		const { Patcher } = this.api;
		Patcher.unpatchAll();
	}
};
