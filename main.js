/*
 main.js - An Atmel (TM) AVR (TM) simulator

 Copyright (C) 2015  Julian Ingram

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function avrjs()
{
    var interval = undefined;
    var frequency = 0;
    var avr = undefined;
    var tick_counter = 0;
    var measure_interval;
    var asleep = false;
    var running = false;
    var extern_sleep_cb = undefined;

    function uart0_write(c)
    {
        if (avr !== undefined)
        {
            avr.uart0_write(c);
        }
    }

    function tick() // function called every 10ms
    {
        var ts = performance.now();
        while ((performance.now() - ts) < 9)
        {
            for (var i = 0; i < 10; ++i)
            {
                //var pc = avr.get_pc() * 2; // * 2 to line up with the values shown in the lss files
                //console.log("    " + pc.toString(16) + " " + avr.get_instruction_name());
                if (asleep == false)
                {
                    avr.tick();
                    tick_counter ++;
                }
            }
        }
    }

    function sleep_cb(s)
    {
        if (s != 0)
        {
            if (interval !== undefined)
            {
                clearInterval(interval);
                interval = undefined;
                asleep = true;
            }
        }
        else
        {
            if ((running == true) && (interval === undefined))
            {
                interval = setInterval(tick, 10);
                asleep = false;
            }
        }
        if (extern_sleep_cb !== undefined)
        {
            extern_sleep_cb(s);
        }
    }

    function run()
    {
        running = true;
        asleep = false;
        if (interval === undefined)
        {
            interval = setInterval(tick, 10);
            measure_interval = setInterval(function () // function called every second
            {
                frequency = (tick_counter / 1000000);
                tick_counter = 0;
            }, 1000);
        }
    }

    function stop()
    {
        running = false;
        asleep = false;
        if (interval !== undefined)
        {
            clearInterval(interval);
            interval = undefined;
            clearInterval(measure_interval);
            measure_interval = undefined;
            frequency = 0;
        }
    }

    function is_running()
    {
        return running;
    }

    function is_asleep()
    {
        return asleep;
    }

    function get_frequency()
    {
        return frequency;
    }

    function load(hex)
    {
        if (avr !== undefined)
        {
            stop();
            ihex_parse(hex, avr.pmem_write_byte);
            return true;
        }
        return false;
    }

    function load_file(file_element)
    {
        if (avr !== undefined)
        {
            stop();
            ihex_handle(file_element, avr.pmem_write_byte);
        }
        return false;
    }

    function init(avr_type, uart0_cb, _extern_sleep_cb)
    {
        var types = {
            "atmega128": atmega128,
            "atmega328": atmega328,
            "attiny1634": attiny1634
        };
        if (avr !== undefined)
        {
            if (interval !== undefined)
            {
                stop();
            }
            avr.destroy();
        }
        avr = types[avr_type](uart0_cb, sleep_cb);
        extern_sleep_cb = _extern_sleep_cb;
    }

    return {
        uart0_write: uart0_write,
        run: run,
        stop: stop,
        is_running: is_running,
        is_asleep: is_asleep,
        get_frequency: get_frequency,
        load: load,
        load_file: load_file,
        init: init
    };
}

function run_stop()
{
    if (window.avrjs.is_running() === true)
    {
        $("#btn_run").prop("value", "Run");
        window.avrjs.stop();
        $("#freq").html("Stopped");
    }
    else
    {
        $("#btn_run").prop("value", "Stop");
        window.avrjs.run();
        if (window.avrjs.is_asleep() === true)
        {
            $("#freq").html("Asleep");
        }
        else
        {
            $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
        }
    }
}

function disp_sleep_cb(s)
{
    if (s != 0)
    { // sleep
        $("#freq").html("Asleep");
    }
    else
    { // wake
        $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    }
}

// functions to pass though to html

function load()
{
    window.avrjs.init($("#device_select").val(), window.u0_term.write, disp_sleep_cb);
    $("#btn_run").prop("value", "Run");
    window.u0_term.clear();
    $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    window.avrjs.load_file(document.getElementById("bin_file"));
}

function main_resize()
{
    window.u0_term.resize($(window).width(), $(window).height() - ($("#nav_bar").outerHeight() + $("#footer").outerHeight()));
}

$(window).resize(function ()
{
    main_resize();
});

function load_default()
{
    window.defaults_loaded = 1;
    // loading avr
    window.avrjs.init("atmega128", window.u0_term.write, disp_sleep_cb);

    // loading hex
    var hot_drop = $("<div style='display:none;'></div>");
    $(document.body).append(hot_drop);
    hot_drop.load("default.hex", function ()
    {
	var hex = hot_drop.html();
        var buf = new ArrayBuffer(hex.length);
        var hex_array = new Uint8Array(buf);
        for (var i = 0; i < hex.length; i++)
        {
            hex_array[i] = hex.charCodeAt(i);
        }
        window.avrjs.load(hex_array);
        window.avrjs.run();

        $("#btn_run").css("display", "inline");
        $("#btn_load").css("display", "inline");
    });
}

$(function()
{
    // avr
    window.avrjs = avrjs();

    // terminal
    var term_div = $("#u0_term");
    var nav_div = $("#nav_bar");
    var foot_div = $("#footer");
    window.u0_term = term(term_div, $(window).width(), $(window).height() - (nav_div.outerHeight() + foot_div.outerHeight()), 10, function (value)
    { // keypress
        if (window.avrjs.is_running() === true)
        {
            window.avrjs.uart0_write(value);
        }
    });
    term_div.focus();

    // frequency
    var freq_div = $("#freq");
    freq_div.html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    interval = setInterval(function () // function called every 2s
    {
        if (window.avrjs.is_running() === false)
        {
            freq_div.html("Stopped");
        }
        else if (window.avrjs.is_asleep() === true)
        {
            freq_div.html("Asleep");
        }
        else
        {
            freq_div.html(window.avrjs.get_frequency().toFixed(2) + " MHz");
        }
    }, 2000);

    // load defaults only once
    if (window.defaults_loaded === 0)
    {
        load_default();
    }
    else
    {
        window.defaults_loaded = 0;
    }
});

var Module = {
    onRuntimeInitialized: function ()
    {
        // load defaults only once
        if (window.defaults_loaded === 0)
        {
            load_default();
        }
        else
        {
            window.defaults_loaded = 0;
        }
    }
};
