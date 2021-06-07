<template>
  <div>
    <el-input
      placeholder="请输入内容"
      prefix-icon="el-icon-search"
      v-model="input"
    >
    </el-input>
    <el-button type="success" plain @click="normalSearch">常规检索</el-button>
    <el-button type="primary" plain @click="treeSearch">字典树检索</el-button>
    <el-button
      type="danger"
      plain
      @click="
        () => {
          resultSearch = null;
        }
      "
      >clear</el-button
    >
    <div v-for="(value, index) of resultSearch" :key="index">{{ value }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, getCurrentInstance, onMounted } from "vue";
import { data5000 } from "./common/data";
export default defineComponent({
  name: "App",
  components: {},
  setup() {
    const { ctx } = getCurrentInstance();
    const input = ref("");
    const resData = ref(null);
    const resultSearch = ref({});
    const getData = () => {
      ctx.$axios
        .get("https://randomuser.me/api/?", {
          params: {
            results: 5000,
            inc: "gender,email,phone,cell,nat",
          },
        })
        .then((res) => {
          resData.value = res.data;
          console.time("createTree");
          treeData.value = createTree(res.data.results);
          console.timeEnd("createTree");
          console.log(treeData.value);
          normalizedData.value = normalize("email", res.data.results);
        });
      // console.time("createTree");
      // treeData.value = createTree(data5000.results);
      // console.timeEnd("createTree");
      // console.log(treeData.value)
      // normalizedData.value = normalize("email", data5000.results);
    };
    class Leaf {
      constructor(id = "", value = "") {
        this.ids = id ? [id] : [];
        this.value = value;
        this.children = {};
      }
      share(id) {
        this.ids.push(id);
      }
    }
    const normalizedData = ref(null);
    //标准化:将一个数组里的对象拆分为 id 与对象的映射关系。
    const normalize = (identify, data) => {
      const id2Value = {};
      data.forEach((item) => {
        const idValue = item[identify];
        id2Value[idValue] = item;
      });
      return id2Value;
    };
    const treeData = ref(null);
    //构建字典树
    const createTree = (results) => {
      const root = new Leaf();
      const identifyKey = "email";
      results.forEach((item) => {
        const identifyValue = item[identifyKey];
        Object.values(item).forEach((itemValue) => {
          const stringifiedValue = String(itemValue);
          let tempRoot = root;
          const arraiedStringifiedValue = Array.from(stringifiedValue);
          arraiedStringifiedValue.forEach((character, characterIndex) => {
            const reachEnd =
              characterIndex === arraiedStringifiedValue.length - 1;
            if (!tempRoot.children[character]) {
              tempRoot.children[character] = new Leaf(
                reachEnd ? identifyValue : "",
                character
              );
              tempRoot = tempRoot.children[character];
            } else {
              if (reachEnd) {
                tempRoot.children[character].share(identifyValue);
              }
              tempRoot = tempRoot.children[character];
            }
          });
        });
      });
      return root;
    };
    const resultArr = ref([]);
    //收集该叶子节点下所有的子节点的 id，当你搜索 a 时，apple, anna, ack 都算匹配
    const collectChildrenInsideIds = (root, arr) => {
      for (let key in root) {
        var children = root[key].children;
        if (root[key].ids.length > 0) {
          arr.push(root[key].ids);
        } else {
          collectChildrenInsideIds(children, arr);
        }
      }
      return arr;
    };
    //搜索
    const searchBlurry = (keyword) => {
      const keywordArr = Array.from(String(keyword));
      let tempRoot = treeData.value;
      let result = [];
      for (let i = 0; i < keywordArr.length; i++) {
        const character = keywordArr[i];
        if (!tempRoot.children[character]) {
          break;
        } else {
          tempRoot = tempRoot.children[character];
        }
        if (keywordArr.length - 1 === i) {
          result = [
            ...tempRoot.ids,
            ...collectChildrenInsideIds(tempRoot.children, resultArr.value),
          ];
          //console.log("ids数组：" + result);
        }
      }
      return result.map((id) => {
        return normalizedData.value[id];
      });
    };

    const treeSearch = () => {
      console.time("treeSearch");
      resultSearch.value = null;
      resultArr.value = [];
      resultSearch.value = searchBlurry(input.value);
      console.timeEnd("treeSearch");
    };
    const normalSearch = () => {
      console.time("normalSearch");
      resultSearch.value = null;
      const regularSearchResults = [];
      resData.value.results.forEach((item) => {
        for (const key in item) {
          const value = item[key];
          if (String(value).startsWith(input.value)) {
            regularSearchResults.push(item);
            break;
          }
        }
      });
      resultSearch.value = regularSearchResults;
      console.timeEnd("normalSearch");
    };
    onMounted(() => {
      getData();
    });
    return {
      input,
      resData,
      treeSearch,
      normalSearch,
      getData,
      normalizedData,
      normalize,
      treeData,
      createTree,
      collectChildrenInsideIds,
      searchBlurry,
      data5000,
      resultArr,
      resultSearch,
    };
  },
});
</script>

<style>
</style>
