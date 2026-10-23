const scenes = {
  barrage: (
    <g>
      <path d="M8 83 Q37 49 64 75 T119 71 T174 70 T249 77" />
      <path d="M25 91 H234 L224 119 H35 Z" />
      {[50, 91, 132, 173, 214].map((x) => (
        <g key={x}>
          <path d={`M${x} 94 V115`} />
          <path d={`M${x - 6} 94 H${x + 6}`} />
        </g>
      ))}
      <path d="M20 126 Q34 120 48 126 T76 126 T104 126 T132 126 T160 126 T188 126 T216 126 T244 126" />
    </g>
  ),

  waterTank: (
    <g>
      <path d="M21 106 H239 M32 106 V77 H74 V106 M40 77 Q53 54 66 77" />
      <path d="M91 106 V71 H169 V106 M99 71 Q130 43 161 71" />
      <path d="M186 106 V77 H228 V106 M194 77 Q207 54 220 77" />
      {[43, 57, 103, 121, 139, 157, 197, 211].map((x) => (
        <path key={x} d={`M${x} 83 V101`} />
      ))}
      <path d="M14 117 Q30 111 46 117 T78 117 T110 117 T142 117 T174 117 T206 117 T246 117" />
      <path d="M14 127 Q30 121 46 127 T78 127 T110 127 T142 127 T174 127 T206 127 T246 127" />
    </g>
  ),

  skyline: (
    <g>
      <path d="M22 117 V66 H48 V117 M29 77 H40 M29 89 H40 M29 101 H40" />
      <path d="M56 117 V37 H83 V117 M63 48 H76 M63 61 H76 M63 74 H76 M63 87 H76 M63 100 H76" />
      <path d="M91 117 V54 H120 V117 M98 65 H113 M98 78 H113 M98 91 H113" />
      <path d="M131 117 V27 H160 V117 M138 40 H153 M138 54 H153 M138 68 H153 M138 82 H153 M138 96 H153" />
      <path d="M170 117 V61 H196 V117 M177 73 H189 M177 86 H189 M177 99 H189" />
      <path d="M206 117 V79 H233 V117 M213 90 H226 M213 102 H226" />
      <path d="M8 121 H252 M8 129 H252" />
      <path d="M18 122 L35 129 M60 122 L77 129 M102 122 L119 129 M144 122 L161 129 M186 122 L203 129 M228 122 L245 129" />
    </g>
  ),

  gateway: (
    <g>
      <path d="M28 121 V73 H65 V121 M185 121 V73 H222 V121" />
      <path d="M24 73 H69 V64 H24 Z M181 73 H226 V64 H181 Z" />
      <path d="M74 121 V88 Q125 24 176 88 V121 Z" />
      <path d="M88 121 V90 Q125 46 162 90 V121" />
      <path d="M104 121 V100 Q125 76 146 100 V121" />
      <path d="M8 121 H244 M15 129 H237" />
      <path d="M34 56 H58 M190 56 H214" />
    </g>
  ),

  grainMarket: (
    <g>
      <path d="M17 119 V77 L57 53 L97 77 V119 Z" />
      <path d="M29 119 V88 H47 V119 M63 119 V88 H81 V119" />
      <path d="M116 119 V62 Q116 50 128 50 Q140 50 140 62 V119 Z" />
      <path d="M147 119 V49 Q147 37 159 37 Q171 37 171 49 V119 Z" />
      <path d="M178 119 V67 Q178 55 190 55 Q202 55 202 67 V119 Z" />
      <path d="M111 67 H145 M142 54 H176 M173 72 H207" />
      <path d="M8 121 H250 M17 129 H243" />
    </g>
  ),

  temple: (
    <g>
      <path d="M41 120 V83 H219 V120 M29 120 H231" />
      <path d="M63 83 Q130 22 197 83 Z" />
      <path d="M110 66 V48 Q130 21 150 48 V66" />
      <path d="M116 48 L130 27 L144 48 M130 27 V15" />
      <path d="M72 83 V70 Q88 47 104 70 V83 M156 83 V70 Q172 47 188 70 V83" />
      <path d="M57 94 H203 M57 104 H203 M57 114 H203" />
      {[79, 106, 132, 158, 185].map((x) => (
        <path key={x} d={`M${x} 91 V119`} />
      ))}
      <path d="M14 129 H246" />
    </g>
  ),

  capitol: (
    <g>
      <path d="M20 119 V79 H91 V119 M20 79 H91 M29 88 V112 M43 88 V112 M57 88 V112 M71 88 V112 M83 88 V112" />
      <path d="M101 119 V64 H152 V119 M101 64 H152 M109 76 V111 M121 76 V111 M133 76 V111 M145 76 V111" />
      <path d="M164 119 V91 H231 V119 M164 91 H231 M174 99 V112 M188 99 V112 M202 99 V112 M216 99 V112" />
      <path d="M12 123 H248 M23 130 H237" />
      <path d="M125 52 L130 21 L135 52 M130 21 V9" />
    </g>
  ),

  palace: (
    <g>
      <path d="M20 120 V74 H240 V120 M12 120 H248" />
      <path d="M35 74 V62 Q48 42 61 62 V74 M87 74 V48 Q105 18 123 48 V74 M137 74 V48 Q155 18 173 48 V74 M199 74 V62 Q212 42 225 62 V74" />
      <path d="M45 120 V89 Q48 80 51 89 V120 M96 120 V88 Q105 76 114 88 V120 M146 120 V88 Q155 76 164 88 V120 M207 120 V89 Q212 80 217 89 V120" />
      <path d="M12 130 H248 M20 82 H240" />
    </g>
  ),

  clocktower: (
    <g>
      <path d="M77 121 V54 H183 V121 M69 54 H191 L183 45 H77 Z" />
      <path d="M92 45 L103 28 H157 L168 45 M112 28 V18 H148 V28" />
      <circle cx="130" cy="73" r="17" />
      <path d="M130 61 V73 L140 80" />
      <path d="M91 95 H112 V121 M148 95 H169 V121" />
      <path d="M62 121 H198 M50 130 H210" />
    </g>
  ),

  fort: (
    <g>
      <path d="M24 121 V69 H42 V59 H61 V69 H83 V59 H102 V69 H124 V59 H143 V69 H165 V59 H184 V69 H203 V59 H222 V69 H238 V121 Z" />
      <path d="M39 121 V88 H64 V121 M95 121 V88 H120 V121 M151 121 V88 H176 V121 M196 121 V88 H221 V121" />
      <path d="M8 121 H252 M16 130 H244" />
    </g>
  ),

  garden: (
    <g>
      <path d="M68 121 V84 H192 V121 M56 84 H204" />
      <path d="M82 84 Q130 37 178 84 M94 84 Q130 52 166 84" />
      <path d="M104 121 V94 Q130 73 156 94 V121" />
      <path d="M25 121 V84 M13 87 Q25 55 37 87 M16 73 Q25 46 34 73" />
      <path d="M226 121 V84 M214 87 Q226 55 238 87 M217 73 Q226 46 235 73" />
      <path d="M8 130 H252" />
    </g>
  ),
};

export default function CityIllustration({ type = "skyline" }) {
  return (
    <svg
      viewBox="0 0 260 150"
      role="img"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="#e11d48"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g opacity=".65">
        <path d="M16 30 Q20 24 26 30 Q32 24 38 30" />
        <path d="M204 26 Q208 20 214 26 Q220 20 226 26" />
        <path d="M59 19 Q62 15 65 19 M70 16 Q73 12 76 16" />
        <path d="M179 42 Q184 35 189 42 M189 42 Q194 35 199 42" />
        <path d="M39 37 Q45 31 51 37 M51 37 Q57 31 63 37" />
      </g>
      {scenes[type] || scenes.skyline}
    </svg>
  );
}