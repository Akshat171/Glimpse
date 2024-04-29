import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import Categories from "../../components/categories";
import { apiCall } from "../../api";
import ImageGrid from "../../components/ImageGrid";
import { debounce } from "lodash";
import FilterModel from "../../components/filterModel";

var page = 1;

const HomeScreen = () => {
  const [filters, setFilters] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState("");
  const { top } = useSafeAreaInsets();
  const searchInputRef = useRef(null);
  const paddingTop = top > 0 ? top + 10 : 30;
  const modalRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async (params = { page: 1 }, append = false) => {
    console.log("params", params, append);
    let res = await apiCall(params);
    if (res.success && res?.data?.hits) {
      if (append) {
        setImages([...images, ...res.data.hits]);
      } else {
        setImages([...res.data.hits]);
      }
    }
    // console.log("got result", res.data);
  };

  const handleChangeCategory = (cat) => {
    setActiveCategory(cat);
    clearSearch();
    setImages([]);
    page = 1;
    let params = {
      page,
      ...filters,
    };
    if (cat) {
      params.category = cat;
    }
    fetchImages(params, false);
    //append parameter will be false other wise it will overright result
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 2) {
      //search for this text
      page = 1;
      setImages([]);
      //reseting category while searching images
      setActiveCategory(null);
      fetchImages({ page, q: text, ...filters }, false);
    }

    if (text == "") {
      //reset result
      page = 1;
      searchInputRef?.current?.clear();
      setImages([]);
      //reseting category while searching images
      setActiveCategory(null);
      fetchImages({ page, ...filters }, false);
    }
  };

  const handleDebounce = useCallback(debounce(handleSearch, 400), []);

  const clearSearch = () => {
    setSearch("");
    searchInputRef?.current?.clear();
  };

  const openFiltersModal = () => {
    modalRef?.current?.present();
  };

  const closeFiltersModal = () => {
    modalRef?.current?.close();
  };

  const applyFilters = () => {
    if (filters) {
      page = 1;
      setImages([]);
      let params = {
        page,
        ...filters,
      };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    closeFiltersModal();
  };

  const resetFilters = () => {
    if (filters) {
      page = 1;
      setFilters(null);
      setImages([]);
      let params = {
        page,
      };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    closeFiltersModal();
  };

  const clearThisFilter = (filterName) => {
    let filterz = { ...filters };
    delete filterz[filterName];
    setFilters({ ...filterz });
    page = 1;
    setImages([]);
    let params = {
      page,
      ...filterz,
    };
    if (activeCategory) params.category = activeCategory;
    if (search) params.q = search;
    fetchImages(params, false);
  };

  console.log("Filters", filters);

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.header}>
        <Pressable>
          <Text style={styles.title}>Picstash</Text>
        </Pressable>
        <Pressable onPress={openFiltersModal}>
          <FontAwesome
            name="bars"
            size={22}
            color={theme.colors.neutral(0.7)}
          />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ gap: 15 }}>
        <View style={styles.searchBar}>
          <View style={styles.searchIcon}>
            <Feather
              name="search"
              size={24}
              color={theme.colors.neutral(0.4)}
            />
          </View>
          <TextInput
            placeholder="search for photos..."
            style={styles.input}
            // value={search}
            onChangeText={handleDebounce}
            ref={searchInputRef}
          />
          {search && (
            <Pressable
              style={styles.closeIcon}
              onPress={() => handleSearch("")}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.neutral(0.6)}
              />
            </Pressable>
          )}
        </View>
        <View style={styles.categories}>
          <Categories
            activeCategory={activeCategory}
            handleChangeCategory={handleChangeCategory}
          />
        </View>

        {filters && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {Object.keys(filters).map((key, index) => {
                return (
                  <View key={key} style={styles.filterItem}>
                    {key == "colors" ? (
                      <View
                        style={{
                          height: 30,
                          width: 30,
                          borderRadius: 7,
                          backgroundColor: filters[key],
                        }}
                      />
                    ) : (
                      <Text style={styles.filterItemText}>{filters[key]}</Text>
                    )}

                    <Pressable
                      style={styles.filterCloseIcon}
                      onPress={() => clearThisFilter(key)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.neutral(0.9)}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View>{images.length > 0 && <ImageGrid images={images} />}</View>

        <View
          style={{ marginTop: images.length > 0 ? 10 : 70, marginBottom: 70 }}
        >
          <ActivityIndicator color={theme.colors.neutral(1)} size={"large"} />
        </View>
      </ScrollView>

      <FilterModel
        modalRef={modalRef}
        filters={filters}
        setFilters={setFilters}
        onClose={closeFiltersModal}
        onApply={applyFilters}
        onReset={resetFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 15 },
  header: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.neutral(0.9),
  },
  searchBar: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: theme.colors.grayBG,
    backgroundColor: theme.colors.white,
    padding: 6,
    paddingLeft: 10,
    borderRadius: theme.radius.lg,
  },
  searchIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    fontSize: hp(1.8),
  },
  closeIcon: {
    backgroundColor: theme.colors.neutral(0.1),
    padding: 8,
    borderRadius: theme.radius.sm,
  },
  filters: {
    paddingHorizontal: wp(4),
    gap: 10,
  },
  filterItem: {
    backgroundColor: theme.colors.grayBG,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.xs,
    gap: 10,
    paddingHorizontal: 10,
  },
  filterItemText: {
    fontSize: hp(1.9),
  },
  filterCloseIcon: {
    backgroundColor: theme.colors.neutral(0.2),
    padding: 4,
    borderRadius: 7,
  },
});

export default HomeScreen;
