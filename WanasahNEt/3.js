:do {
    :local mac $"username";
    :local ip $"address";
    :local dom [/ip hotspot active get [find where address="$ip"] domain];
        :local speed [:pick $dom 0 [:find $dom "|"]]
        :local update [:pick $dom ([:find $dom "|"] + 1) [:len $dom]]
    :local defaultSpeed "0k/0k";
        /ip firewall address-list remove numbers=[find where address="$ip"];
    :if ([:len $speed] > 0 && [:find $speed "/"] != nil) do={
        :local up [:pick $speed 0 [:find $speed "/"]];
        :local down [:pick $speed ([:find $speed "/"] + 1) [:len $speed]];
       :if (([:len $up] > 1) && \
     ([:len $down] > 1) && \
     (([:pick $up ([:len $up] - 1)] = "k" || [:pick $up ([:len $up] - 1)] = "K" || \
       [:pick $up ([:len $up] - 1)] = "m" || [:pick $up ([:len $up] - 1)] = "M")) && \
     (([:pick $down ([:len $down] - 1)] = "k" || [:pick $down ([:len $down] - 1)] = "K" || \
       [:pick $down ([:len $down] - 1)] = "m" || [:pick $down ([:len $down] - 1)] = "M"))) do={
            :set speed ($up . "/" . $down);
        } else={
            :set speed $defaultSpeed;
        }
    } else={
        :set speed $defaultSpeed;
    }
    /queue simple remove [find where name="$ip" || target="$ip/32"];
    /queue simple add limit-at=$speed max-limit=$speed name="$ip" queue=sfq/sfq target="$ip";
    /queue simple move [find where name="$ip"] [:pick [find] 0];
    :if ($update="*yes**") do={
       /ip firewall address-list add list="$update" address="$ip";
    }
};