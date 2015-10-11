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
    var speed = 0;
    var avr = undefined;
    var tick_counter = 0;
    var measure_interval;

    function uart0_write(c)
    {
        if (avr !== undefined)
        {
            avr.uart0_write(c);
        }
    }

    function run()
    {
        if (interval === undefined)
        {
            interval = setInterval(function () // function called every 10ms
            {
                var ts = performance.now();
                while ((performance.now() - ts) < speed)
                {
                    for (var i = 0; i < 10; ++i)
                    {
                        //var pc = avr.get_pc() * 2; // * 2 to line up with the values shown in the lss files
                        //console.log(pc.toString(16) + " " + avr.get_instruction_name());
                        avr.tick();
                    }
                    tick_counter += 10;
                }
            }, 10);
            measure_interval = setInterval(function () // function called every second
            {
                frequency = (tick_counter / 1000000);
                tick_counter = 0;
            }, 1000);
        }
    }

    function set_speed(speed_percent)
    {
        speed = (speed_percent / 100) * 9;
    }

    function stop()
    {
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
        return (interval !== undefined) ? true : false;
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

    function init(avr_type, uart0_cb)
    {
        var types = {
            "atmega128": atmega128,
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
        avr = types[avr_type](uart0_cb);
    }

    return {
        uart0_write: uart0_write,
        run: run,
        set_speed: set_speed,
        stop: stop,
        is_running: is_running,
        load: load,
        load_file: load_file,
        init: init,
        get_frequency: get_frequency
    };
}

function run_stop()
{
    if (window.avrjs.is_running() === true)
    {
        $("#btn_run").prop("value", "Run");
        window.avrjs.stop();
        $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    }
    else
    {
        $("#btn_run").prop("value", "Stop");
        window.avrjs.run();
        $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    }
}

// functions to pass though to html

function load()
{
    window.avrjs.init($("#device_select").val(), window.u0_term.write);
    $("#btn_run").prop("value", "Run");
    window.u0_term.clear();
    $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    window.avrjs.load_file(document.getElementById("bin_file"));
}

function set_speed(speed)
{
    window.avrjs.set_speed(speed);
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
    window.avrjs.init("atmega128", window.u0_term.write);

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
        window.avrjs.set_speed($("#speed_slider").val());
        window.avrjs.run();

        $("#btn_run").css("display", "inline");
        $("#btn_load").css("display", "inline");
    });
}

$(function ()
{
    // avr
    window.avrjs = avrjs();

    // terminal
    var termdiv = $("#u0_term");
    window.u0_term = term(termdiv, $(window).width(), $(window).height() - ($("#nav_bar").outerHeight() + $("#footer").outerHeight()), 10, function (value)
    {
        if (window.avrjs.is_running() === true)
        {
            window.avrjs.uart0_write(value);
        }
    });
    termdiv.focus();
    main_resize();

    // frequency
    $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    interval = setInterval(function () // function called every 2s
    {
        $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
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
