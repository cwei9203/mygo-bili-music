/* @ds-bundle: {"format":3,"namespace":"SpectrumDesignSystem_a44d86","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/content/Avatar.jsx"},{"name":"Icon","sourcePath":"components/content/Icon.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Picker","sourcePath":"components/forms/Picker.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Menu","sourcePath":"components/navigation/Menu.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"d01dc502047e","components/actions/IconButton.jsx":"25d07cfb901e","components/content/Avatar.jsx":"6ea170460fd2","components/content/Icon.jsx":"f454769c9722","components/feedback/Badge.jsx":"830c45386c8f","components/feedback/Dialog.jsx":"cc028a9cecad","components/feedback/ProgressBar.jsx":"66c1485bb402","components/feedback/Toast.jsx":"17f3f8163e5b","components/forms/Checkbox.jsx":"644ad281decf","components/forms/Picker.jsx":"b5e20d931d1e","components/forms/SearchField.jsx":"6251cbcf7da3","components/forms/Switch.jsx":"b4bd305dd30b","components/forms/TextField.jsx":"59f85075bab5","components/navigation/Menu.jsx":"177920403972","components/navigation/Tabs.jsx":"a72f07f8dc43"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SpectrumDesignSystem_a44d86 = window.SpectrumDesignSystem_a44d86 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/Icon.jsx
try { (() => {
const ICONS = {
  "check": "<path d=\"M7.86426,15.73438c-.22266,0-.43359-.09863-.57617-.26953l-3.74707-4.49805c-.26562-.31836-.22168-.79199.0957-1.05664.31738-.26562.79004-.22363,1.05664.0957l3.15332,3.78613,7.43945-9.46875c.25586-.32617.72852-.38184,1.05273-.12695.32617.25586.38281.72754.12695,1.05273l-8.01172,10.19824c-.13965.17871-.35254.28418-.5791.28711h-.01074Z\" fill=\"currentColor\"/>",
  "checkCircle": "<path d=\"M10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75ZM10,2.75c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z\" fill=\"currentColor\"/> <path d=\"M9.22266,13.5c-.21191,0-.41504-.08984-.55762-.24805l-2.51074-2.79199c-.27734-.30859-.25195-.78223.05566-1.05957s.78125-.25195,1.05957.05566l1.89355,2.10645,3.4873-4.75586c.24316-.33398.71094-.40918,1.04785-.16113.33398.24414.40625.71387.16113,1.04785l-4.03223,5.5c-.13281.18262-.3418.29492-.56738.30566-.01172.00098-.02441.00098-.03711.00098Z\" fill=\"currentColor\"/>",
  "chevronDown": "<path d=\"M3.75488,7.24316c.28711-.29883.76172-.3086,1.05957-.02051l5.18359,4.98633,5.19727-4.99902c.29785-.28808.77246-.27832,1.05957.02051.28711.29687.27832.77246-.02051,1.05957l-5.7168,5.5c-.29004.28027-.74902.28027-1.03906,0l-5.70312-5.4873c-.15332-.14649-.23047-.34375-.23047-.54004,0-.18751.06934-.37501.20996-.51954Z\" fill=\"currentColor\"/>",
  "chevronUp": "<path d=\"M3.54492,12.2373c0-.19629.07715-.39355.23047-.54004l5.70312-5.4873c.29004-.28027.74902-.28027,1.03906,0l5.7168,5.5c.29883.28711.30762.7627.02051,1.05957-.28711.29883-.76172.30859-1.05957.02051l-5.19727-4.99902-5.18359,4.98633c-.29785.28809-.77246.27832-1.05957-.02051-.14062-.14453-.20996-.33203-.20996-.51954Z\" fill=\"currentColor\"/>",
  "chevronLeft": "<path d=\"m12.2373,16.45508c-.19629,0-.39355-.07715-.54004-.23047l-5.4873-5.70312c-.28027-.29004-.28027-.74902,0-1.03906l5.5-5.7168c.28711-.29883.7627-.30762,1.05957-.02051.29883.28711.30859.76172.02051,1.05957l-4.99902,5.19727,4.98633,5.18359c.28809.29785.27832.77246-.02051,1.05957-.14453.14062-.33203.20996-.51953.20996Z\" fill=\"currentColor\"/>",
  "chevronRight": "<path d=\"m7.75,16.46484c-.1875,0-.37402-.06934-.51953-.20996-.29883-.28711-.30859-.76172-.02051-1.05957l4.99902-5.19727-4.98633-5.18359c-.28809-.29785-.27832-.77246.02051-1.05957.2959-.28711.77344-.2793,1.05957.02051l5.4873,5.70312c.28027.29004.28027.74902,0,1.03906l-5.5,5.7168c-.14648.15332-.34375.23047-.54004.23047Z\" fill=\"currentColor\"/>",
  "search": "<path d=\"m18.53027,17.46973l-5.08325-5.08325c.96936-1.20142,1.55298-2.72644,1.55298-4.38647,0-3.85938-3.14062-7-7-7S1,4.14062,1,8s3.14062,7,7,7c1.66003,0,3.18506-.58362,4.38647-1.55298l5.08325,5.08325c.14648.14648.33789.21973.53027.21973s.38379-.07324.53027-.21973c.29297-.29297.29297-.76758,0-1.06055Zm-10.53027-3.96973c-3.03223,0-5.5-2.46777-5.5-5.5s2.46777-5.5,5.5-5.5,5.5,2.46777,5.5,5.5-2.46777,5.5-5.5,5.5Z\" fill=\"currentColor\"/>",
  "close": "<path d=\"m11.06061,10l5.20648-5.20605c.29297-.29297.29297-.76758,0-1.06055s-.76758-.29297-1.06055,0l-5.20654,5.20605L4.79346,3.7334c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l5.20648,5.20605-5.20648,5.20605c-.29297.29297-.29297.76758,0,1.06055.14648.14648.33838.21973.53027.21973s.38379-.07324.53027-.21973l5.20654-5.20605,5.20654,5.20605c.14648.14648.33838.21973.53027.21973s.38379-.07324.53027-.21973c.29297-.29297.29297-.76758,0-1.06055l-5.20648-5.20605Z\" fill=\"currentColor\"/>",
  "play": "<path d=\"M4.74902,18.00391c-.39795,0-.79541-.10742-1.15332-.32129-.68604-.41016-1.0957-1.13281-1.0957-1.93164V4.24902c0-.79883.40967-1.52148,1.0957-1.93164.68555-.40918,1.51514-.42969,2.21924-.0498l10.70117,5.75098c.73047.39258,1.18408,1.15234,1.18408,1.98145s-.45361,1.58887-1.18408,1.98145l-10.70117,5.75098c-.33643.18164-.70166.27148-1.06592.27148ZM4.75244,3.49609c-.17822,0-.31836.06836-.38721.10938-.10986.06543-.36523.25977-.36523.64355v11.50195c0,.38379.25537.57812.36523.64355s.40137.19824.73975.01758l10.70068-5.75098c.35596-.19238.39453-.52637.39453-.66113s-.03857-.46875-.39453-.66113L5.10498,3.58789c-.12646-.06738-.24609-.0918-.35254-.0918Z\" fill=\"currentColor\"/>",
  "pause": "<path d=\"m6.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25ZM4.25,3.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z\" fill=\"currentColor\"/> <path d=\"m15.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-2.5-14.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z\" fill=\"currentColor\"/> <path d=\"m6.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25ZM4.25,3.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z\" fill=\"currentColor\"/> <path d=\"m15.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-2.5-14.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z\" fill=\"currentColor\"/>",
  "add": "<path d=\"m16.25,9.25h-5.5V3.75c0-.41406-.33594-.75-.75-.75s-.75.33594-.75.75v5.5H3.75c-.41406,0-.75.33594-.75.75s.33594.75.75.75h5.5v5.5c0,.41406.33594.75.75.75s.75-.33594.75-.75v-5.5h5.5c.41406,0,.75-.33594.75-.75s-.33594-.75-.75-.75Z\" fill=\"currentColor\"/>",
  "more": "<circle cx=\"10\" cy=\"10.02114\" r=\"1.5\" fill=\"currentColor\"/> <path d=\"m10,8.5c-.82843,0-1.5.67157-1.5,1.5s.67157,1.5,1.5,1.5,1.5-.67157,1.5-1.5-.67157-1.5-1.5-1.5Z\" fill=\"currentColor\"/> <circle cx=\"4\" cy=\"10.02114\" r=\"1.5\" fill=\"currentColor\"/> <circle cx=\"4\" cy=\"10\" r=\"1.5\" fill=\"currentColor\"/> <circle cx=\"16\" cy=\"10.02114\" r=\"1.5\" fill=\"currentColor\"/> <circle cx=\"16\" cy=\"10\" r=\"1.5\" fill=\"currentColor\"/>",
  "list": "<path d=\"m17.25,16.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z\" fill=\"currentColor\"/> <path d=\"m17.25,10.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z\" fill=\"currentColor\"/> <path d=\"m17.25,4.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z\" fill=\"currentColor\"/> <circle cx=\"3.5\" cy=\"3.77108\" r=\"1.5\" fill=\"currentColor\"/> <circle cx=\"3.5\" cy=\"9.77108\" r=\"1.5\" fill=\"currentColor\"/> <circle cx=\"3.5\" cy=\"15.77108\" r=\"1.5\" fill=\"currentColor\"/>",
  "shuffle": "<path d=\"M18.74414,4.1875l-2.25-2.25c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l1.00195,1.00195h-2.22363c-2.1084,0-4.00098,1.29883-4.79688,3.25195l-2.46973,4.87305c-.58887,1.44238-1.93652,2.375-3.43359,2.375h-1.79785c-.41406,0-.75.33594-.75.75s.33594.75.75.75h1.79785c2.10938,0,4.00293-1.29883,4.79688-3.25195l2.46973-4.87305c.58984-1.44238,1.9375-2.375,3.43359-2.375h2.15918l-.9375.9375c-.29297.29297-.29297.76758,0,1.06055.14648.14648.33789.21973.53027.21973s.38379-.07324.53027-.21973l2.25-2.25c.29297-.29297.29297-.76758,0-1.06055Z\" fill=\"currentColor\" stroke-width=\"0\"/> <path d=\"M7.10254,7.38867c-.23438,0-.46484-.10938-.61133-.31348-.7041-.98633-1.81836-1.5752-2.97949-1.5752h-1.79785c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h1.79785c1.64453,0,3.21484.82324,4.2002,2.20215.24023.33789.16309.80566-.17383,1.04688-.13281.09473-.28516.13965-.43555.13965Z\" fill=\"currentColor\" stroke-width=\"0\"/> <path d=\"M18.74414,14.73633l-2.25-2.25c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l.95312.95312h-2.17383c-1.15527,0-2.26562-.58398-2.9707-1.5625-.24121-.33398-.70898-.41211-1.04688-.16992-.33594.24219-.41211.71094-.16992,1.04688.98535,1.36816,2.55078,2.18555,4.1875,2.18555h2.20703l-.98633.98633c-.29297.29297-.29297.76758,0,1.06055.14648.14648.33789.21973.53027.21973s.38379-.07324.53027-.21973l2.25-2.25c.29297-.29297.29297-.76758,0-1.06055Z\" fill=\"currentColor\" stroke-width=\"0\"/>",
  "refresh": "<path d=\"M18.20654,3.89746c-.40527-.09473-.80811.15039-.90527.55371l-.38043,1.57471c-1.39771-2.43188-4.00189-4.00439-6.92084-4.00439-3.68457,0-6.87549,2.5-7.75928,6.08008-.09961.40234.146.80859.54834.9082.40137.09961.80859-.14648.90771-.54883.71826-2.9082,3.31006-4.93945,6.30322-4.93945,2.51685,0,4.73499,1.44629,5.80896,3.63232l-2.10242-.5083c-.40332-.09375-.80762.15039-.90527.55371-.09717.40234.15039.80762.55273.90527l3.24524.78418c.12476.08862.27362.14258.43152.14258.05957,0,.12012-.00684.18018-.02148.04822-.01196.08582-.04102.12921-.06104.06952-.01855.14331-.01953.20575-.05811.16943-.10352.29102-.27051.33789-.46387l.87549-3.62402c.09717-.40234-.15039-.80762-.55273-.90527Z\" fill=\"currentColor\"/> <path d=\"M17.21094,11.03223c-.39697-.09668-.80811.14648-.90771.54883-.71826,2.90918-3.31006,4.94043-6.30322,4.94043-2.51703,0-4.73523-1.44653-5.80914-3.63354l2.1026.50854c.40283.0918.80811-.15039.90527-.55371.09717-.40234-.15039-.80762-.55273-.90527l-3.25494-.78662c-.17102-.11816-.38531-.17139-.60199-.11865-.0152.00391-.026.01465-.04071.01929-.10321.01318-.20392.04419-.29425.09985-.16943.10352-.29102.27051-.33789.46387l-.87549,3.62402c-.09717.40234.15039.80762.55273.90527.05957.01367.11865.02051.17676.02051.33838,0,.64551-.23047.72852-.57422l.38043-1.57471c1.39764,2.43213,4.00189,4.00537,6.92084,4.00537,3.68457,0,6.87549-2.50098,7.75928-6.08105.09961-.40234-.146-.80859-.54834-.9082Z\" fill=\"currentColor\"/>",
  "volume": "<path d=\"m13.00098,12.74707c-.2417,0-.47949-.11719-.62402-.33301-.22998-.34473-.1377-.81055.20703-1.04102.41113-.27441.6665-.80176.6665-1.37598s-.25537-1.10156-.6665-1.37598c-.34473-.23047-.43701-.69629-.20703-1.04102.23047-.34375.69727-.43555,1.04004-.20703.82275.5498,1.3335,1.55566,1.3335,2.62402s-.51074,2.07422-1.3335,2.62402c-.12793.08496-.27246.12598-.41602.12598Z\" fill=\"currentColor\"/> <path d=\"m9.24805,18.33691c-.45459,0-.8999-.17773-1.23535-.51367l-2.60352-2.60352c-.13965-.13965-.33301-.21973-.53027-.21973h-1.62891c-1.24072,0-2.25-1.00977-2.25-2.25v-5.5c0-1.24023,1.00928-2.25,2.25-2.25h1.62891c.19727,0,.39062-.08008.53027-.21973l2.60352-2.60352c.50244-.50293,1.25-.65234,1.90723-.37891.65625.27148,1.08008.90625,1.08008,1.61621v13.17188c0,.70996-.42383,1.34473-1.08008,1.61621-.21826.09082-.4458.13477-.67188.13477ZM3.25,6.5c-.41357,0-.75.33691-.75.75v5.5c0,.41309.33643.75.75.75h1.62891c.59229,0,1.17188.24023,1.59082.65918l2.60352,2.60352c.10205.10156.21338.07812.27246.05371.05762-.02344.1543-.08496.1543-.23047V3.41406c0-.14551-.09668-.20703-.1543-.23047-.05908-.02539-.17041-.0498-.27246.05371l-2.60352,2.60352c-.41895.41895-.99854.65918-1.59082.65918h-1.62891Z\" fill=\"currentColor\"/>",
  "star": "<path d=\"M5.50586,18.63037c-.35938.00049-.71875-.1123-1.02734-.33691-.59375-.43164-.85352-1.16797-.66016-1.87646l.97754-3.57715c.0791-.28906-.02051-.5957-.25391-.78271l-2.89258-2.31934c-.57324-.45947-.79688-1.20801-.57031-1.90674.22754-.69824.84766-1.17188,1.58203-1.20654l3.70312-.17529c.29883-.01416.55957-.2041.66504-.4834l1.3125-3.46875c.25977-.6875.90234-1.13135,1.63672-1.13135s1.37695.44385,1.63672,1.13086v.00049l1.31055,3.46826c.10645.2793.36816.46973.66602.48389l3.7041.17529c.7334.03467,1.35449.5083,1.58203,1.20703.22656.69873.00293,1.44727-.57031,1.90625l-2.89355,2.31934c-.23242.18652-.33301.49414-.25391.78271l.97656,3.57422c.19336.70996-.06641,1.44775-.66211,1.87891-.59766.43359-1.37891.44727-1.99316.0415l-3.07129-2.03662c-.25098-.16553-.5752-.16602-.82617-.00146l-3.11719,2.04443c-.29492.19336-.62793.28955-.96094.28955ZM9.97852,2.86572c-.0791,0-.18359.02832-.23438.16211l-1.31152,3.46777c-.31641.83936-1.10059,1.40918-1.99805,1.45166l-3.70312.17529c-.14258.00684-.20117.09766-.22559.17236-.02441.0752-.03027.18311.08105.27295l2.89258,2.31885c.70117.56055,1.00098,1.48291.76367,2.34912l-.97754,3.57617c-.03809.13721.03027.22168.09473.26807.0625.04492.16211.08545.28418.00684l3.11719-2.04492c.75293-.49316,1.72559-.4917,2.47656.00537l3.07129,2.03662c.12109.0791.22168.04004.28516-.00635.06445-.04639.13281-.13037.09473-.26807l-.97656-3.57471c-.23633-.86572.06348-1.78711.76367-2.34814l2.89355-2.31934c.11133-.08887.10547-.19727.08105-.27197-.02441-.0752-.08301-.16602-.22559-.17285l-3.7041-.17529c-.89551-.04248-1.67969-.61182-1.99805-1.45117l-1.31055-3.46826c-.05078-.13379-.15527-.16211-.23438-.16211Z\" fill=\"currentColor\"/>",
  "starFilled": "<path d=\"M11.49541,2.41401l1.20352,3.18317c.21146.55928.73487.93956,1.33211.96784l3.39952.16098c1.49264.07068,2.10363,1.95114.9376,2.88567l-2.6558,2.12853c-.46708.37435-.66689.99056-.50834,1.56776l.8957,3.26096c.3964,1.44316-1.20676,2.60738-2.45643,1.78386l-2.81918-1.85781c-.49979-.32936-1.14755-.33006-1.64806-.00178l-2.86668,1.88025c-1.24918.81934-2.84794-.34282-2.45403-1.78386l.89758-3.2836c.15766-.57675-.04227-1.19206-.50883-1.56599l-2.65557-2.12834c-1.16603-.93453-.55503-2.81498.9376-2.88567l3.39945-.16098c.59724-.02828,1.12065-.40856,1.33211-.96782l1.20357-3.1832c.52848-1.39773,2.50569-1.39772,3.03416.00001Z\" fill=\"currentColor\"/>",
  "music": "<path d=\"M17.17627,1.58887c-.52344-.42773-1.20459-.59668-1.86719-.46582l-7.00049,1.40039c-1.04785.20996-1.80859,1.1377-1.80859,2.20605v8.99646c-.85083-.32532-1.94965-.29114-3.02637.18811-1.82373.81348-2.77344,2.52441-2.1626,3.89551.30908.69238.98584,1.18164,1.85693,1.3418.2124.03906.43213.05762.65625.05762.6001,0,1.23145-.1377,1.83008-.4043.82275-.36719,1.50439-.94141,1.91992-1.61816.28088-.45801.42566-.94116.42578-1.40723V7.15039l8.5-1.69995v6.27539c-.85065-.3252-1.9491-.29102-3.02637.18823-1.82373.81348-2.77344,2.52441-2.1626,3.89551.30908.69238.98584,1.18164,1.85693,1.3418.2124.03906.43213.05762.65625.05762.6001,0,1.23145-.1377,1.83008-.4043.82275-.36719,1.50439-.94141,1.91992-1.61816.28088-.45801.42566-.94116.42578-1.40723V3.33008c0-.67676-.30029-1.31152-.82373-1.74121ZM5.04346,17.43457c-.54199.24023-1.12793.32812-1.60498.24121-.22119-.04102-.61426-.15625-.75732-.47754-.22656-.50781.29443-1.41992,1.40332-1.91406.43408-.19336.85547-.27734,1.2207-.27734.56934,0,1.00391.20312,1.1416.5127.03571.07983.05139.16284.05322.24548.00488.24939-.11609.49329-.20459.63733-.25439.41406-.71045.79102-1.25195,1.03223ZM16.5,13.7666c.00488.2478-.11609.4917-.20459.63574-.25439.41406-.71045.79102-1.25195,1.03223-.5415.24023-1.12646.3291-1.60498.24121-.22119-.04102-.61426-.15625-.75732-.47754-.22656-.50781.29443-1.41992,1.40332-1.91406.43408-.19336.85547-.27734,1.2207-.27734.56934,0,1.00391.20312,1.1416.5127.03571.07983.05139.16284.05322.24707ZM16.5,3.9209l-8.5,1.69995v-.89136c0-.35547.25391-.66504.60303-.73535l7-1.40039c.22021-.04395.44775.01074.62207.15527.1748.14355.2749.35547.2749.58105v.59082Z\" fill=\"currentColor\" stroke-width=\"0\"/>",
  "settings": "<path d=\"M10.00391,12.58887c-.88818,0-1.75293-.45996-2.22803-1.2832h0c-.70801-1.22754-.28613-2.80078.93994-3.50879.59326-.34375,1.28516-.43359,1.94922-.25684.6626.17773,1.21631.60352,1.55908,1.19727.34326.59375.43408,1.28613.25684,1.94824-.17773.66309-.60254,1.2168-1.19678,1.55957-.40332.2334-.84473.34375-1.28027.34375ZM9.07471,10.55566c.29443.50879.94824.68359,1.45947.39062.24707-.14258.42383-.37305.49756-.64844s.03613-.56348-.10645-.81055c-.14307-.24707-.37305-.42383-.64893-.49805-.2749-.07324-.56299-.03516-.81055.10645-.51025.29492-.68555.94922-.39111,1.45996h0Z\" fill=\"currentColor\"/> <path d=\"M6.90674,18.31836c-.33936,0-.68213-.08496-.99219-.26465l-.81982-.47266c-.89307-.51367-1.25-1.64941-.81104-2.58301l.58008-1.2334c-.26514-.36328-.48975-.75098-.67188-1.16113l-1.35693-.1123c-1.02881-.08496-1.83447-.95996-1.83447-1.99121l-.00098-.94629c0-1.0332.80518-1.90918,1.8335-1.99414l1.35449-.11426c.0918-.20898.19238-.40918.30176-.59961.10986-.19141.2334-.37891.36914-.56445l-.58057-1.22949c-.44092-.93262-.08643-2.06836.80713-2.58496l.82031-.47363c.89258-.5166,2.05371-.25879,2.64258.58984l.77734,1.11816c.44385-.0498.89209-.04785,1.34082,0l.77539-1.11914c.58887-.84961,1.75098-1.10938,2.64355-.59375l.81982.47266c.89404.51562,1.24951,1.65137.81055,2.58398l-.58008,1.23242c.26562.36426.49023.75195.67188,1.16113l1.35693.1123c1.02832.08496,1.83398.95996,1.83496,1.99121l.00049.94727c.00098,1.03125-.80371,1.90723-1.83203,1.99414l-1.35547.11426c-.09131.20898-.19189.4082-.30273.59961h0c-.10938.18945-.23242.37793-.36816.56348l.58057,1.22949c.44043.93164.08643,2.06738-.80664,2.58496l-.8208.47461c-.89355.51855-2.05371.25781-2.64258-.59082l-.77734-1.11816c-.4458.04883-.89404.04785-1.34082.00098l-.77637,1.12012c-.38379.55371-1.01172.85645-1.65039.85645ZM6.9043,3.22461c-.08496,0-.17041.02148-.24805.06641l-.8208.47461c-.22266.12891-.31152.41211-.20117.64551l.77881,1.65039c.12598.2666.08398.58203-.10742.80664-.2041.23926-.37305.47656-.5166.72559-.14111.24609-.26514.51855-.36816.80957-.09814.27832-.3501.47266-.64404.49707l-1.81885.15332c-.26172.02246-.4585.23633-.4585.49902l.00098.94629c0,.25781.20117.47656.4585.49805l1.81934.15039c.29395.02441.54639.21875.64502.49707.19873.56055.49707,1.07617.88672,1.53223.19189.22363.23438.54004.10889.80664l-.77783,1.65234c-.10938.2334-.021.51758.20264.64551l.82031.47363c.22412.12988.51416.06348.66016-.14746l1.04102-1.50195c.16748-.24219.45898-.36914.75244-.30957.58838.10742,1.18457.1084,1.77002-.00098.28955-.05469.58496.06641.75342.30957l1.04199,1.49902c.14648.20996.43848.27637.66064.14746l.82031-.47363c.22607-.13086.31348-.40918.20117-.64648l-.77881-1.65039c-.12598-.2666-.08398-.58203.10742-.80664.2041-.24023.37305-.47656.51562-.72461l.00049-.00098c.14258-.24707.26318-.51172.36865-.80957.09863-.27832.35059-.47266.64453-.49707l1.81885-.15234c.25635-.02246.45752-.24121.45752-.49902l-.00049-.94727c0-.26172-.19727-.47559-.45898-.49805l-1.81885-.15039c-.29395-.02441-.54639-.21875-.64502-.49707-.19775-.55957-.49658-1.0752-.88721-1.53223-.19141-.22461-.23389-.54004-.1084-.80664l.77734-1.65234c.10986-.2334.021-.51758-.20264-.64648l-.81982-.47266c-.22461-.12695-.51416-.06152-.66113.14941l-1.03955,1.5c-.16797.24316-.45898.36816-.75293.31055-.59131-.10938-1.1875-.10938-1.77002,0-.29199.05176-.58545-.06738-.75342-.30957l-1.04199-1.49902c-.09619-.1377-.25293-.21387-.41211-.21387Z\" fill=\"currentColor\"/>",
  "edit": "<path d=\"m17.78076,1.75684c-1.27197-1.04102-3.22705-.89844-4.4502.32324L3.07764,12.33398c-.32031.31934-.55859.7168-.68896,1.15039l-1.38428,4.58398c-.08008.26465-.00781.55176.1875.74707.14258.14258.33447.21973.53027.21973.07227,0,.14551-.01074.2168-.03223l4.58252-1.38379c.43359-.12988.83154-.36816,1.15088-.68848,0,0,10.16846-10.16797,10.35547-10.35547.64795-.64746.99316-1.54492.94775-2.45996-.0459-.91504-.48145-1.77539-1.19482-2.3584ZM2.84473,17.16309l.97998-3.24609c.02716-.09033.06714-.17578.11377-.25732l2.40869,2.40918c-.08154.04639-.16718.08643-.25781.11377l-3.24463.98047Zm14.12158-11.64746c-.15472.15552-7.09985,7.1001-9.52545,9.52588l-2.47461-2.4751L14.39111,3.14062c.38623-.38672.896-.58594,1.38965-.58594.38086,0,.75244.11914,1.05029.3623.3916.32129.62109.77246.646,1.27246.0249.49316-.16113.97656-.51074,1.32617Z\" fill=\"currentColor\" />",
  "alert": "<path d=\"m9.99936,15.12334c-.23065.00812-.45538-.07378-.62661-.22835-.33033-.36462-.33033-.91993,0-1.28455.16935-.15832.39483-.24279.62664-.23476.23635-.00947.46589.08026.63302.24745.16207.1677.24916.39386.24137.62681.01238.23469-.06959.4646-.2277.63864-.17358.16455-.40786.24959-.64671.23475Z\" fill=\"currentColor\"/> <path d=\"m10,11.75c-.41406,0-.75-.33594-.75-.75v-4c0-.41406.33594-.75.75-.75s.75.33594.75.75v4c0,.41406-.33594.75-.75.75Z\" fill=\"currentColor\"/> <path d=\"m16.7334,18H3.2666c-.80029,0-1.52295-.41016-1.93262-1.09766s-.42725-1.51855-.04639-2.22266L8.021,2.23242c.39355-.72754,1.15186-1.17969,1.979-1.17969s1.58545.45215,1.979,1.17969l6.7334,12.44727c.38086.7041.36328,1.53516-.04639,2.22266s-1.13232,1.09766-1.93262,1.09766ZM10,2.55273c-.13428,0-.46777.03809-.65967.39258L2.60693,15.39258c-.18311.33887-.05029.63184.01562.74121.06543.11035.25928.36621.64404.36621h13.4668c.38477,0,.57861-.25586.64404-.36621.06592-.10938.19873-.40234.01562-.74121L10.65967,2.94531c-.19189-.35449-.52539-.39258-.65967-.39258Z\" fill=\"currentColor\"/>",
  "info": "<path d=\"m10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75Zm0-16c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z\" fill=\"currentColor\"/> <path d=\"m10.00064,5.26036c.23065-.00813.45538.07387.62661.22862.33033.36505.33033.92102,0,1.28607-.16935.15851-.39483.24308-.62664.23504-.23635.00948-.46589-.08035-.63302-.24775-.16207-.1679-.24916-.39432-.24137-.62755-.01238-.23497.06959-.46515.2277-.6394.17358-.16474.40786-.24988.64671-.23503Z\" fill=\"currentColor\"/> <path d=\"m10,15.0625c-.41406,0-.75-.33594-.75-.75v-4.83496c0-.41406.33594-.75.75-.75s.75.33594.75.75v4.83496c0,.41406-.33594.75-.75.75Z\" fill=\"currentColor\"/>",
  "stepBack": "<path d=\"m9.74902,15.95508c-.39404,0-.78711-.10645-1.14453-.31738l-6.25439-3.70117c-.69189-.40918-1.10449-1.13281-1.10449-1.93652s.4126-1.52734,1.10449-1.93652l6.25439-3.70117c.70508-.41602,1.55029-.42188,2.26025-.01758.71094.40625,1.13525,1.13574,1.13525,1.9541v7.40234c0,.81836-.42432,1.54785-1.13525,1.9541-.3501.19922-.7334.2998-1.11572.2998Zm-.00391-10.4082c-.11328,0-.24219.02734-.37695.10645l-6.25439,3.70117c-.33252.19629-.36816.5166-.36816.64551s.03564.44922.36816.64551l6.25439,3.70117c.3374.2002.63965.07031.75342.00586.11377-.06543.37842-.25879.37842-.65137v-7.40234c0-.39258-.26465-.58594-.37842-.65137-.06836-.03906-.20508-.10059-.37646-.10059Z\" fill=\"currentColor\"/> <path d=\"m16.75,16h-.5c-1.24072,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00928-2.25,2.25-2.25h.5c1.24072,0,2.25,1.00977,2.25,2.25v7.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-.5-10.5c-.41357,0-.75.33691-.75.75v7.5c0,.41309.33643.75.75.75h.5c.41357,0,.75-.33691.75-.75v-7.5c0-.41309-.33643-.75-.75-.75h-.5Z\" fill=\"currentColor\"/>",
  "stepForward": "<path d=\"m10.25098,15.95508c-.38281,0-.76562-.10059-1.11572-.2998-.71094-.40625-1.13525-1.13574-1.13525-1.9541v-7.40234c0-.81836.42432-1.54785,1.13525-1.9541.71143-.40332,1.55615-.39746,2.26025.01758l6.25439,3.70117c.69189.40918,1.10449,1.13281,1.10449,1.93652s-.4126,1.52734-1.10449,1.93652l-6.25439,3.70117c-.35742.21094-.75098.31738-1.14453.31738Zm.00391-10.40918c-.17139,0-.30811.0625-.37646.10156-.11377.06543-.37842.25879-.37842.65137v7.40234c0,.39258.26465.58594.37842.65137.11377.06445.41406.19141.75342-.00586l6.25439-3.70117c.33252-.19629.36816-.5166.36816-.64551s-.03564-.44922-.36816-.64551l-6.25439-3.70117c-.13477-.08008-.26367-.10742-.37695-.10742Z\" fill=\"currentColor\"/> <path d=\"m3.75,16h-.5c-1.24072,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00928-2.25,2.25-2.25h.5c1.24072,0,2.25,1.00977,2.25,2.25v7.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-.5-10.5c-.41357,0-.75.33691-.75.75v7.5c0,.41309.33643.75.75.75h.5c.41357,0,.75-.33691.75-.75v-7.5c0-.41309-.33643-.75-.75-.75h-.5Z\" fill=\"currentColor\"/>"
};
function Icon({
  name,
  size = 20,
  color,
  className,
  style
}) {
  const markup = ICONS[name];
  if (!markup) return null;
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    focusable: "false",
    className: className,
    style: {
      flexShrink: 0,
      color,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: markup
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon
} = __ds_scope;
function Button({
  children,
  variant = 'primary',
  fillStyle = 'fill',
  size = 'M',
  disabled = false,
  icon,
  onPress,
  onClick,
  type = 'button',
  ...rest
}) {
  const className = ['s2-btn', `s2-btn--${variant}`, size !== 'M' && `s2-btn--${size.toLowerCase()}`, fillStyle === 'outline' && 's2-btn--outline'].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: className,
    disabled: disabled,
    onClick: onClick || onPress
  }, rest), icon ? /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'S' ? 14 : 18
  }) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon
} = __ds_scope;
function IconButton({
  icon,
  label,
  variant = 'quiet',
  size = 'M',
  disabled = false,
  onPress,
  onClick,
  ...rest
}) {
  const className = ['s2-iconbtn', variant === 'secondary' && 's2-iconbtn--secondary', size === 'S' && 's2-iconbtn--s'].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: className,
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick || onPress
  }, rest), /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'S' ? 16 : 20
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/content/Avatar.jsx
try { (() => {
function Avatar({
  src,
  alt = '',
  name = '',
  size = 32
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", {
    className: "s2-avatar",
    style: {
      width: size,
      height: size,
      fontSize: Math.max(9, Math.round(size * 0.36))
    },
    title: name || alt || undefined
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt || name
  }) : initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  children,
  variant = 'neutral',
  fillStyle = 'bold',
  icon
}) {
  const className = ['s2-badge', variant !== 'neutral' && `s2-badge--${variant}`, fillStyle === 'subtle' && 's2-badge--subtle'].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", {
    className: className
  }, icon ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
const {
  useEffect
} = React;
function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = event => {
      if (event.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-dialog-overlay",
    onMouseDown: event => {
      if (event.target === event.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "s2-dialog",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    style: width ? {
      width
    } : undefined
  }, title ? /*#__PURE__*/React.createElement("h2", {
    className: "s2-dialog__title"
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    className: "s2-dialog__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    className: "s2-dialog__footer"
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function ProgressBar({
  label,
  ariaLabel,
  value = 0,
  isIndeterminate = false,
  showValue = false
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", {
    className: 's2-progress' + (isIndeterminate ? ' is-indeterminate' : ''),
    role: "progressbar",
    "aria-label": label || ariaLabel,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": isIndeterminate ? undefined : Math.round(clamped)
  }, label || showValue ? /*#__PURE__*/React.createElement("div", {
    className: "s2-progress__head"
  }, /*#__PURE__*/React.createElement("span", null, label), showValue && !isIndeterminate ? /*#__PURE__*/React.createElement("span", {
    className: "s2-progress__value"
  }, Math.round(clamped), "%") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "s2-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "s2-progress__fill",
    style: isIndeterminate ? undefined : {
      width: `${clamped}%`
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  toasts = [],
  onDismiss
}) {
  if (!toasts.length) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-toast-region",
    role: "region",
    "aria-label": "\u901A\u77E5"
  }, toasts.map(toast => /*#__PURE__*/React.createElement("div", {
    className: "s2-toast",
    role: "status",
    key: toast.id
  }, /*#__PURE__*/React.createElement("span", null, toast.message), toast.actionLabel ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s2-toast__action",
    onClick: () => {
      if (toast.onAction) toast.onAction();
      if (onDismiss) onDismiss(toast.id);
    }
  }, toast.actionLabel) : null)));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useEffect,
  useRef
} = React;
const {
  Icon
} = __ds_scope;
function Checkbox({
  children,
  isSelected = false,
  isIndeterminate = false,
  isDisabled = false,
  onChange,
  ...rest
}) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);
  return /*#__PURE__*/React.createElement("label", {
    className: "s2-check"
  }, /*#__PURE__*/React.createElement("input", _extends({
    ref: inputRef,
    type: "checkbox",
    checked: isSelected,
    disabled: isDisabled,
    onChange: onChange
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "s2-check__box",
    "aria-hidden": "true"
  }, isIndeterminate ? /*#__PURE__*/React.createElement("span", {
    className: "s2-check__dash"
  }) : /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12
  })), children ? /*#__PURE__*/React.createElement("span", {
    className: "s2-check__label"
  }, children) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Picker.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
const {
  Icon
} = __ds_scope;
function Picker({
  label,
  items = [],
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  placeholder = '请选择',
  isDisabled = false
}) {
  const [open, setOpen] = useState(false);
  const [internalKey, setInternalKey] = useState(defaultSelectedKey);
  const rootRef = useRef(null);
  const key = selectedKey !== undefined ? selectedKey : internalKey;
  const selected = items.find(item => item.id === key);
  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const choose = id => {
    if (selectedKey === undefined) setInternalKey(id);
    if (onSelectionChange) onSelectionChange(id);
    setOpen(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-picker",
    ref: rootRef
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "s2-field__label"
  }, label) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s2-picker__trigger",
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    disabled: isDisabled,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement("span", {
    className: "s2-picker__value",
    style: !selected ? {
      color: 'var(--s2-text-subdued)'
    } : undefined
  }, selected ? selected.label : placeholder), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    size: 16
  })), open ? /*#__PURE__*/React.createElement("div", {
    className: "s2-popover"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "s2-menu",
    role: "listbox",
    "aria-label": label
  }, items.map(item => /*#__PURE__*/React.createElement("li", {
    key: item.id
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "option",
    "aria-selected": item.id === key,
    className: "s2-menu__item",
    onClick: () => choose(item.id)
  }, item.label, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    className: "s2-menu__check"
  })))))) : null);
}
Object.assign(__ds_scope, { Picker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Picker.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useId
} = React;
const {
  Icon
} = __ds_scope;
function SearchField({
  label,
  placeholder = '搜索',
  value,
  defaultValue,
  onChange,
  onClear,
  isDisabled = false,
  ...rest
}) {
  const id = useId();
  const filled = value !== undefined ? String(value).length > 0 : false;
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-field s2-search"
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "s2-field__label",
    htmlFor: id
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "s2-field__control"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 18,
    style: {
      color: 'var(--s2-text-subdued)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: "search",
    className: "s2-field__input",
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: isDisabled,
    "aria-label": label || placeholder
  }, rest)), filled ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s2-iconbtn s2-iconbtn--s",
    "aria-label": "\u6E05\u9664\u641C\u7D22",
    onClick: () => {
      if (onClear) onClear();
      if (onChange) onChange({
        target: {
          value: ''
        }
      });
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 14
  })) : null));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  children,
  isSelected = false,
  isDisabled = false,
  onChange,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "s2-switch"
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: isSelected,
    disabled: isDisabled,
    onChange: onChange
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "s2-switch__track",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "s2-switch__thumb"
  })), children ? /*#__PURE__*/React.createElement("span", {
    className: "s2-switch__label"
  }, children) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useId
} = React;
function TextField({
  label,
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = 'text',
  ...rest
}) {
  const id = useId();
  const invalid = !!errorMessage;
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-field"
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "s2-field__label",
    htmlFor: id
  }, label, isRequired ? /*#__PURE__*/React.createElement("span", {
    className: "s2-field__required"
  }, "*") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: 's2-field__control' + (invalid ? ' is-invalid' : '')
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: type,
    className: "s2-field__input",
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: isDisabled,
    "aria-invalid": invalid || undefined,
    required: isRequired || undefined
  }, rest))), errorMessage || description ? /*#__PURE__*/React.createElement("span", {
    className: 's2-field__help' + (invalid ? ' is-invalid' : '')
  }, errorMessage || description) : null);
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Menu.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
const {
  Button
} = __ds_scope;
const {
  Icon
} = __ds_scope;
function Menu({
  label = '更多',
  icon = 'more',
  items = [],
  onAction,
  variant = 'secondary',
  size = 'M'
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-menu-wrap",
    ref: rootRef
  }, /*#__PURE__*/React.createElement(Button, {
    variant: variant,
    size: size,
    icon: icon,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onPress: () => setOpen(!open)
  }, label), open ? /*#__PURE__*/React.createElement("div", {
    className: "s2-popover s2-popover--start",
    style: {
      minWidth: 192
    }
  }, /*#__PURE__*/React.createElement("ul", {
    className: "s2-menu",
    role: "menu"
  }, items.map(item => /*#__PURE__*/React.createElement("li", {
    key: item.id
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "menuitem",
    className: "s2-menu__item",
    onClick: () => {
      setOpen(false);
      if (onAction) onAction(item.id);
    }
  }, item.icon ? /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 16
  }) : null, item.label))))) : null);
}
Object.assign(__ds_scope, { Menu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Menu.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
function Tabs({
  items = [],
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  children
}) {
  const [internalKey, setInternalKey] = useState(defaultSelectedKey || items[0] && items[0].id);
  const key = selectedKey !== undefined ? selectedKey : internalKey;
  const active = items.find(item => item.id === key);
  const select = id => {
    if (selectedKey === undefined) setInternalKey(id);
    if (onSelectionChange) onSelectionChange(id);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "s2-tabs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "s2-tablist",
    role: "tablist"
  }, items.map(item => /*#__PURE__*/React.createElement("button", {
    key: item.id,
    type: "button",
    role: "tab",
    "aria-selected": item.id === key,
    className: "s2-tab",
    onClick: () => select(item.id)
  }, item.label))), /*#__PURE__*/React.createElement("div", {
    className: "s2-tabpanel",
    role: "tabpanel"
  }, children || (active ? active.content : null)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Picker = __ds_scope.Picker;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
