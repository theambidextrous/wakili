from pipeline.search import Search

s = Search()
res = s.perform_search("what's docling?", 5)
print(res)