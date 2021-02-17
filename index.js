var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;
var cmd_debug = false;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions
	self.init_presets();

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.init_presets();

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;
	self.init_presets();
	self.init_tcp();
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function (socket) {
			self.status(self.STATE_OK);
			debug("Connected");
			console.log('PN-LE910 Connected');

			socket.once('close', function() {
				console.log('PN-LE910 Disconnect');
			})
		})

		self.socket.on('data', function (d) {
			if (cmd_debug == true) { console.log('Recived: %s', d); }

			if (String(d) == 'Login:\r') {
				self.socket.write(self.config.user + '\r');
				if (cmd_debug == true) { console.log('Response: ' + self.config.user); }
			}
			if (String(d) == 'Password:\r') {
				self.socket.write(self.config.pass + '\r');
				if (cmd_debug == true) { console.log('Response: ' + self.config.pass); }
			}
		})

	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 5,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port (Default: 10008)',
			width: 3,
			default: 10008,
			regex: self.REGEX_PORT
		},
		{
			type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'Please type in your ID and Password credentials:'
		},
		{
			type: 'textinput',
			id: 'user',
			label: 'ID',
			width: 4,
			default: ''
		},
		{
			type: 'textinput',
			id: 'pass',
			label: 'Password',
			width: 4,
			default: ''
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	if (self.udp !== undefined) {
		self.udp.destroy();
	}

	debug("destroy", self.id);
};

instance.prototype.CHOICES_INPUTS = [
	{ id: '1   ', 	label: 'HDMI 1' },
	{ id: '2   ', 	label: 'HDMI 2' },
	{ id: '3   ', 	label: 'HDMI 3' },
	{ id: '4   ', 	label: 'VIDEO IN 1' },
	{ id: '5   ', 	label: 'VIDEO IN 2' },
	{ id: '6   ', 	label: 'PC' },
];

instance.prototype.CHOICES_AV_MODE = [
	{ id: '0   ', 	label: 'Toggle',					short: 'Toggle' },
	{ id: '1   ', 	label: 'Standard',				short: 'STD' },
	{ id: '2   ', 	label: 'Movie',						short: 'Movie' },
	{ id: '4   ', 	label: 'User',						short: 'User' },
	{ id: '5   ', 	label: 'Dynamic (Fixed)',	short: 'DYN (Fixed)' },
	{ id: '6   ', 	label: 'Dynamic',					short: 'DYN' },
	{ id: '7   ', 	label: 'PC',							short: 'PC' },
];

instance.prototype.CHOICES_VIEW_MODE = [
	{ id: '0   ', 	label: 'Toggle [AV]',									short: 'Toggle [AV]' },
	{ id: '1   ', 	label: 'Side Bar [AV]',								short: 'Side Bar [AV]' },
	{ id: '2   ', 	label: 'S.Stretch [AV]',							short: 'S.STR [AV]' },
	{ id: '3   ', 	label: 'Zoom [AV]',										short: 'Zoom [AV]' },
	{ id: '4   ', 	label: 'Stretch [AV, USB, Network]',	short: 'STR [ALL]' },
	{ id: '5   ', 	label: 'Normal [PC]',									short: 'Normal [PC]' },
	{ id: '7   ', 	label: 'Stretch [PC]',								short: 'STR [PC]' },
	{ id: '8   ', 	label: 'Dot By Dot [PC, AV]',					short: 'D by D [PC AV]' },
	{ id: '9   ', 	label: 'Fullscreen [AV]',							short: 'Full [AV]' },
	{ id: '10  ',		label: 'Auto [USB, Network]',					short: 'Auto [USB]' },
	{ id: '11  ',		label: 'Original [USB, Network]',			short: 'Orginal [USB]' },
];

instance.prototype.CHOICES_SLEEP = [
	{ id: '0   ', 	label: 'OFF' },
	{ id: '1   ', 	label: '30 Min' },
	{ id: '2   ', 	label: '60 Min' },
	{ id: '3   ', 	label: '90 Min' },
	{ id: '4   ', 	label: '120 Min' },
	{ id: '5   ', 	label: '150 Min' },
];

instance.prototype.CHOICES_VOLUME = [
	{ id: 'volume', 			label: 'Vol  0%',		value: '0' },
	{ id: 'volume', 			label: 'Vol  25%',		value: '25' },
	{ id: 'volume', 			label: 'Vol  50%',		value: '50' },
	{ id: 'volume', 			label: 'Vol  75%',		value: '75' },
	{ id: 'volume', 			label: 'Vol 100%',	value: '100' },
	{ id: 'mute_on', 			label: 'Mute ON' },
	{ id: 'mute_off', 		label: 'Myte OFF' },
	{ id: 'mute_tog', 		label: 'Myte Toggle' },
	{ id: 'surround_on', 	label: 'SURR ON' },
	{ id: 'surround_off',	label: 'SURR OFF' },
	{ id: 'surround_tog', label: 'SURR Toggle' },
];

instance.prototype.CHOICES_CHANNEL = [
	{ id: 'ch_up',	 			label: 'CH  Up'	},
	{ id:	'ch_down',			label: 'CH Down'	},
];

instance.prototype.CHOICES_COMMANDS_1 = [
	{ id: 'pw_on', 		label: 'Power ON' },
	{ id: 'pw_off', 	label: 'Power OFF' },
	{ id: 'stb_on', 	label: 'Standby ON' },
	{ id: 'stb_off', 	label: 'Standby OFF' },
	{ id: 'volume',		label: 'Volume' },
	{ id: 'ch_up',	 			label: 'CH  Up'	},
	{ id:	'ch_down',			label: 'CH Down'	},
	{ id: 'cc_tog',		label: 'CC Toggle' },
];

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];
	var pstSize = '18';

	presets.push({
		category: 'Inputs',
		label: 'TV',
		bank: {
			style: 'text',
			text: 'TV',
			size: pstSize,
			color: '16777215',
			bgcolor: 0
		},
		actions: [{
			action: 'input_tv',
		}]
	});

	for (var input in self.CHOICES_INPUTS) {
		presets.push({
			category: 'Inputs',
			label: self.CHOICES_INPUTS[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_INPUTS[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'input',
				options: {
					action: self.CHOICES_INPUTS[input].id,
				}
			}]
		});
	}

	for (var input in self.CHOICES_VOLUME) {
		presets.push({
			category: 'Volume / Sound',
			label: self.CHOICES_VOLUME[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_VOLUME[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'volume',
				options: {
					action: self.CHOICES_VOLUME[input].value,
				}
			}]
		});
	}
	
	for (var input in self.CHOICES_CHANNEL) {
		presets.push({
			category: 'Channel Analog',
			label: self.CHOICES_CHANNEL[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_CHANNEL[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: self.CHOICES_CHANNEL[input].id,
			}]
		});
	}	

	for (var i = 0; i < 135; i++) {
		presets.push({
			category: 'Channel Analog',
			label: 'CH ' + (i+1),
			bank: {
				style: 'text',
				text: 'CH ' + (i+1),
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'ch_analog',
				options: {
					action: (i+1),
				}
			}]
		});
	}

	for (var input in self.CHOICES_CHANNEL) {
		presets.push({
			category: 'Channel Digital',
			label: self.CHOICES_CHANNEL[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_CHANNEL[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: self.CHOICES_CHANNEL[input].id,
			}]
		});
	}	

	for (var i = 0; i < 200; i++) {
		presets.push({
			category: 'Channel Digital',
			label: 'CH ' + (i+1),
			bank: {
				style: 'text',
				text: 'CH ' + (i+1),
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'ch_digital_l',
				options: {
					action: (i+1),
				}
			}]
		});
	}



	for (var input in self.CHOICES_AV_MODE) {
		presets.push({
			category: 'AV Mode',
			label: self.CHOICES_AV_MODE[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_AV_MODE[input].short,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'av_mode',
				options: {
					action: self.CHOICES_AV_MODE[input].id,
				}
			}]
		});
	}

	for (var input in self.CHOICES_VIEW_MODE) {
		presets.push({
			category: 'View Mode',
			label: self.CHOICES_VIEW_MODE[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_VIEW_MODE[input].short,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'view_mode',
				options: {
					action: self.CHOICES_VIEW_MODE[input].id,
				}
			}]
		});
	}

	for (var input in self.CHOICES_SLEEP) {
		presets.push({
			category: 'Sleep Timer',
			label: 'Sleep  ' + self.CHOICES_SLEEP[input].label,
			bank: {
				style: 'text',
				text: 'Sleep  ' + self.CHOICES_SLEEP[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'sleep',
				options: {
					action: self.CHOICES_SLEEP[input].id,
				}
			}]
		});
	}

	for (var input in self.CHOICES_COMMANDS_1) {
		presets.push({
			category: 'Commands',
			label: self.CHOICES_COMMANDS_1[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_COMMANDS_1[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: self.CHOICES_COMMANDS_1[input].id,
			}]
		});
	}

	self.setPresetDefinitions(presets);
}

instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {

		'pw_on': 		{	label: 'Network Card ON'		},
		'pw_off':		{	label: 'Network Card OFF'	},
		'stb_on': 	{	label: 'Standby Power ON'		},
		'stb_off':	{	label: 'Standby Power OFF'	},
		'input_tv':	{	label: 'Input Select TV'	},

		'input': {
			label: 'Input Select',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Input',
					default: '1',
					choices: self.CHOICES_INPUTS
				},
			]
		},
		'av_mode': {
			label: 'AV Mode Selection',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Mode:',
					default: '1',
					choices: self.CHOICES_AV_MODE
				},
			]
		},
		'volume': {
			label: 'Set Volume',
			options: [
				{
					type: 'number',
					id: 'action',
					label: 'Volume 0-100%',
					min: 1,
					max: 100,
					default: 50,
					required: true,
					range: false,
					regex: self.REGEX_NUMBER
				}
			]
		},
		'view_mode': {
			label: 'View Mode',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Mode:',
					default: '1',
					choices: self.CHOICES_VIEW_MODE
				},
			]
		},
		'ch_analog': {
			label: 'Direct Channel (Analog)',
			options: [
				{
					type: 'number',
					id: 'action',
					label: 'Channel number (1-135)',
					min: 1,
					max: 135,
					default: 1,
					required: true,
					range: false,
					regex: self.REGEX_NUMBER
				}
			]
		},
		'ch_digital_l': {
			label: 'Direct Channel (Digital <10000)',
			options: [
				{
					type: 'number',
					id: 'action',
					label: 'Channel number (0-9999)',
					min: 0,
					max: 9999,
					default: 1,
					required: true,
					range: false,
					regex: self.REGEX_NUMBER
				}
			]
		},
		'ch_digital_h': {
			label: 'Direct Channel (Digital >10000)',
			options: [
				{
					type: 'number',
					id: 'action',
					label: 'Channel number (0-6383 = 10000-16383)',
					min: 0,
					max: 6383,
					default: 1,
					required: true,
					range: false,
					regex: self.REGEX_NUMBER
				}
			]
		},

		'ch_up':	 			{ label: 'Channel Up'	},
		'ch_down':			{	label: 'Channel Down'	},
		'mute_on': 			{ label: 'Myte Audio ON'	},
		'mute_off':			{	label: 'Mute Audio OFF'	},
		'mute_tog':			{	label: 'Toggle Mute Audio'	},
		'surround_on': 	{ label: 'Surround Audio ON'	},
		'surround_off':	{	label: 'Surround Audio OFF'	},
		'surround_tog':	{	label: 'Toggle Surround Audio'	},
		'cc_tog':				{	label: 'Toggle Closed Captions'	},
		
		'sleep': {
			label: 'Sleep Timer',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Sleep timer set:',
					default: '1',
					choices: self.CHOICES_SLEEP
				},
			]
		},
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd;

	switch(action.action) {

		case 'pw_on':					cmd = 'RSPW2   ';	break;
		case 'pw_off':				cmd = 'RSPW0   ';	break;
		case 'stb_on':				cmd = 'POWR1   ';	break;
		case 'stb_off':				cmd = 'POWR0   ';	break;
		case 'input_tv':			cmd = 'ITVD0   ';	break;
		case 'input':					cmd = 'IAVD' + action.options.action;	break;
		case 'av_mode':				cmd = 'AVMD' + action.options.action;	break;
		case 'volume':				cmd = 'VOLM' + action.options.action;	break;
		case 'view_mode':			cmd = 'WIDE' + action.options.action;	break;
		case 'ch_analog':			cmd = 'DCCH' + action.options.action + ' ';	break;
		case 'ch_digital_l':	cmd = 'DC10' + action.options.action;	break;
		case 'ch_digital_h':	cmd = 'DC11' + action.options.action;	break;
		case 'ch_up':					cmd = 'CHUP1   ';	break;
		case 'ch_down':				cmd = 'CHDW2   ';	break;
		case 'mute_on':				cmd = 'MUTE1   ';	break;
		case 'mute_off':			cmd = 'MUTE2   ';	break;
		case 'mute_tog':			cmd = 'MUTE0   ';	break;
		case 'surround_on':		cmd = 'ACSU1   ';	break;
		case 'surround_off':	cmd = 'ACSU2   ';	break;
		case 'surround_tog':	cmd = 'ACSU0   ';	break;
		case 'cc_tog':				cmd = 'CLCP1   ';	break;
		case 'sleep':					cmd = 'OFTM' + action.options.action;	break;

	}

	if (cmd !== undefined) {

		debug('sending ',cmd,"to",self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd+'\r');
		}
		else {
			debug('Socket not connected :(');
		}
	}

}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
